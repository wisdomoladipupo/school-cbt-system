"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStoredToken, getStoredUser } from "../../../../lib/api";
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
  const [_, setSubmitted] = useState(false);

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
          questions: questions.map(
            (q: { id: number; text: string; options: string[] }) => ({
              id: q.id,
              question: q.text,
              options: q.options,
              correctAnswer: undefined,
            })
          ),
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

      await resultsAPI.submit(payload, token);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700">
            Loading exam...
          </div>
          <div className="mt-2 text-gray-500">
            Please wait while we prepare your exam.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              {/* Student Profile Picture */}
              {getStoredUser()?.passport ? (
                <div className="flex-shrink-0 h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={getStoredUser()?.passport}
                    alt="Student"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://ui-avatars.com/api/?name=" +
                        encodeURIComponent(
                          getStoredUser()?.full_name || "Student"
                        ) +
                        "&background=4f46e5&color=fff&size=128";
                    }}
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">
                    {getStoredUser()?.full_name?.[0]?.toUpperCase() || "S"}
                  </span>
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  {exam.title}
                </h1>
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                  <div className="mt-1 flex items-center text-sm text-gray-700">
                    <span className="font-semibold">
                      {getStoredUser()?.full_name || "Student"}
                    </span>
                    {getStoredUser()?.registration_number && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                        {getStoredUser()?.registration_number}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="font-medium">Email:</span>
                    <span className="ml-1">
                      {getStoredUser()?.email || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <div className="px-4 py-2 bg-white text-gray-900 rounded-md text-lg font-semibold border border-gray-200 shadow-sm">
                <Timer
                  ref={timerRef}
                  minutes={Number(exam.duration) || 30}
                  onExpire={handleSubmit}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Progress:</span>{" "}
              <span className="font-semibold">
                {currentIndex + 1} of {exam.questions.length} questions
              </span>
            </p>
            <div className="text-sm text-gray-500">
              {exam.duration} minute time limit
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Main content area */}
          <div className="p-6">
            {/* Current question */}
            <div className="mb-8">
              <QuestionCard
                question={exam.questions[currentIndex]}
                index={currentIndex}
                total={exam.questions.length}
                selected={answers[currentIndex]}
                onAnswer={(value: string | number) =>
                  handleAnswer(currentIndex, value)
                }
              />
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`px-4 py-2 rounded-md border ${
                  currentIndex === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                Previous
              </button>

              <div className="flex-1 flex justify-center">
                <div className="flex flex-wrap gap-2 justify-center">
                  {exam.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentIndex === index
                          ? "bg-blue-600 text-white"
                          : answers[index] !== null
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      aria-label={`Go to question ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              {currentIndex < exam.questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
