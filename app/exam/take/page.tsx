"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../dashboard/layout";
import { getExamById, addResult } from "../../../lib/db";
import Timer, { TimerHandle } from "../../../components/cbt/Timer";
import QuestionCard from "../../../components/cbt/QuestionCard";

// Page types
export interface MCQQuestion {
  question: string;       // HTML content
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

  // Load exam from DB and map types
  useEffect(() => {
    if (!examId) return;

    const loadExam = async () => {
      const dbExam = await getExamById(examId);
      if (!dbExam) return;

  const mapped: Exam = {
  id: dbExam.id ?? 0, // <- ensures it's always a number
  title: dbExam.title,
  duration: dbExam.duration ?? 30,
  questions: dbExam.questions.map(q => ({
    question: q.question,
    options: q.options, // see next error
    correctAnswer: q.correctAnswer,
  })),
};

      setExam(mapped);
      setAnswers(Array(mapped.questions.length).fill(null));
    };

    loadExam();
  }, [examId]);

  // Answer handler
  const handleAnswer = (qIndex: number, value: string | number) => {
    setAnswers(prev => {
      const copy = [...prev];
      copy[qIndex] = value;
      return copy;
    });
  };

  const handleNext = () => {
    if (!exam) return;
    setCurrentIndex(i => Math.min(i + 1, exam.questions.length - 1));
  };

  const handlePrev = () => {
    setCurrentIndex(i => Math.max(i - 1, 0));
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

    const finishedAt = Date.now();
    const duration = startedAt ? Math.round((finishedAt - startedAt) / 1000) : 0;
    const { score, max } = computeScore();

    let currentUser: User | null = null;
    try {
      const raw = localStorage.getItem("currentUser");
      currentUser = raw ? JSON.parse(raw) : null;
    } catch (e) {}

    const payload: Result = {
      examId,
      studentEmail: currentUser?.email || "unknown",
      answers: answers.map(a => (a == null ? "" : String(a))),
      score,
      max,
      duration,
      finishedAt,
      ...(startedAt !== null ? { startedAt } : {}),
    };

    await addResult(payload);
    setSubmitted(true);
  };

  const handleStart = () => {
    setStartedAt(Date.now());
    timerRef.current.start();
  };

  if (!exam) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading exam...</div>
      </DashboardLayout>
    );
  }

  if (submitted) {
    const { score, max } = computeScore();
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <h1 className="text-2xl font-semibold">Exam Submitted</h1>
          <p className="text-lg">You scored {score} / {max}</p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => router.push("/results")}
            >
              View Results
            </button>
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => router.push("/dashboard/student")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
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
            <button
              className="px-3 py-2 bg-green-600 text-white rounded"
              onClick={handleStart}
            >
              Start
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <QuestionCard
              question={exam.questions[currentIndex]}
              index={currentIndex}
              total={exam.questions.length}
              selected={answers[currentIndex]}
              onAnswer={(value: string | number) => handleAnswer(currentIndex, value)}
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
