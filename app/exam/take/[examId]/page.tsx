"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../../dashboard/layout";
import { getStoredToken } from "../../../../lib/api";
import { examsAPI, questionsAPI, resultsAPI } from "../../../../lib/api/api";
import Timer, { TimerHandle } from "../../../../components/cbt/Timer";
import QuestionCard from "../../../../components/cbt/QuestionCard";

// Page types
export interface MCQQuestion {
  id: number; // Question ID from backend
  question: string; // HTML content
  options: string[];
  correctAnswer?: string | number;
}

export interface Exam {
  id: number;
  title: string;
  duration: number; // in minutes
  questions: MCQQuestion[];
}

export interface User {
  email: string;
  name?: string;
  role?: string;
}

export interface Result {
  examId: number;
  studentEmail: string;
  answers: string[];
  score: number;
  max: number;
  duration: number;
  finishedAt: number;
  startedAt?: number;
}

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = Number(params.examId);

  const [exam, setExam] = useState<Exam | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | number | null)[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const timerRef = useRef<TimerHandle>(null!);

  // Load exam from API
  useEffect(() => {
    if (!examId) return;

    const loadExam = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

        const exam = await examsAPI.getById(examId);
        const questions = await questionsAPI.getForExam(examId, token);

        const mapped: Exam = {
          id: exam.id,
          title: exam.title,
          duration: exam.duration_minutes,
          questions: questions.map((q) => ({
            id: q.id,
            question: q.text,
            options: q.options,
            correctAnswer: undefined,
          })),
        };

        setExam(mapped);
        setAnswers(Array(mapped.questions.length).fill(null));
      } catch (error) {
        console.error("Failed to load exam:", error);
      }
    };

    loadExam();
  }, [examId]);

  // Answer handler
  const handleAnswer = (qIndex: number, value: string | number) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIndex] = value;
      return copy;
    });
  };

  const handleNext = () => {
    if (!exam) return;
    setCurrentIndex((i) => Math.min(i + 1, exam.questions.length - 1));
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  // Compute score
  const computeScore = () => {
    if (!exam) return { score: 0, max: 0 };
    let score = 0;
    const max = exam.questions.length;

    exam.questions.forEach((q, i) => {
      if (q.correctAnswer != null && answers[i] === q.correctAnswer) {
        score += 1;
      }
    });

    return { score, max };
  };

  // Submit exam
  const handleSubmit = async () => {
    if (!exam) return;

    try {
      const token = getStoredToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const payload = {
        exam_id: examId,
        answers: exam.questions.map((q, i) => ({
          question_id: q.id, // <-- use actual question ID
          answer_index: answers[i] === null ? -1 : Number(answers[i]),
        })),
      };

      const result = await resultsAPI.submit(payload, token);
      setSubmitted(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/student");
      }, 2000);
    } catch (error) {
      console.error("Failed to submit exam:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to submit exam. Please try again.";
      alert(errorMsg);
    }
  };

  const handleStart = () => {
    setStartedAt(Date.now());
    timerRef.current.start();
  };

  // Auto-start timer when exam loads
  useEffect(() => {
    if (exam && !startedAt && timerRef.current) {
      handleStart();
    }
  }, [exam, startedAt]);

  if (!exam) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading exam...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{exam.title}</h1>
          <div className="flex items-center gap-4">
            <Timer
              ref={timerRef}
              minutes={Number(exam.duration) || 30}
              onExpire={handleSubmit}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <QuestionCard
              question={exam.questions[currentIndex]}
              index={currentIndex}
              total={exam.questions.length}
              selected={answers[currentIndex]}
              onAnswer={(value: string | number) =>
                handleAnswer(currentIndex, value)
              }
            />

            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrev}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Previous
              </button>
              {currentIndex < exam.questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Submit Exam
                </button>
              )}
            </div>
          </div>

          <aside className="md:col-span-1 border rounded p-4 bg-white">
            <h3 className="font-semibold mb-2">Question List</h3>
            <ul className="space-y-2 max-h-[60vh] overflow-auto">
              {exam.questions.map((_, i) => (
                <li key={i}>
                  <button
                    onClick={() => setCurrentIndex(i)}
                    className={`w-full text-left p-2 rounded ${
                      i === currentIndex ? "bg-indigo-100" : "hover:bg-gray-50"
                    }`}
                  >
                    Question {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
