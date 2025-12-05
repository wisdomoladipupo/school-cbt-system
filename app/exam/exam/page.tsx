"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "../../dashboard/layout";
import { getStoredToken, getStoredUser } from "@/lib/api";
import { examsAPI } from "@/lib/api/api";
import ImportQuestionsModal from "@/components/exams/ImportQuestionsModal";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_answer: number;
  marks: number;
  image_url?: string | null;
}

interface Exam {
  id: number;
  title: string;
  description?: string;
}

export default function ExamPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = getStoredToken();
  const user = getStoredUser();

  const examIdParam = searchParams.get("examId");
  const examId = examIdParam ? parseInt(examIdParam) : null;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (!token || !examId) {
      setError("Invalid exam ID or missing token.");
      setLoading(false);
      return;
    }

    const loadExamAndQuestions = async () => {
      try {
        setLoading(true);

        // Fetch exam details
        const examData: Exam = await examsAPI.getById(examId, token);
        setExam(examData);

        // Fetch questions
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/exams/${examId}/questions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to fetch questions");
        }

        const questionsData: Question[] = await response.json();
        setQuestions(questionsData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load exam questions");
      } finally {
        setLoading(false);
      }
    };

    loadExamAndQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  if (!user) return null;

  return (
    <DashboardLayout>
      {loading ? (
        <p>Loading exam...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : !exam ? (
        <p>Exam not found.</p>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{exam.title}</h2>
            {user?.role === "teacher" || user?.role === "admin" ? (
              <button
                onClick={() => setImportModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
              >
                Import Questions
              </button>
            ) : null}
          </div>
          {exam.description && <p className="mb-4">{exam.description}</p>}

          <h3 className="text-xl font-semibold mb-2">Questions</h3>
          {questions.length === 0 ? (
            <p>No questions found for this exam.</p>
          ) : (
            <ul className="space-y-4">
              {questions.map((q, index) => (
                <li key={q.id} className="p-3 border rounded-md">
                  <p className="font-semibold">
                    {index + 1}. {q.text}
                  </p>
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${q.image_url}`}
                    alt="Question"
                  />

                  <ul className="list-disc pl-5 mt-1">
                    {q.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>

                  <p className="text-sm text-gray-500">Marks: {q.marks}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <ImportQuestionsModal
        examId={examId || 0}
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          // Reload questions after successful import
          setImportModalOpen(false);
          if (examId && token) {
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/exams/${examId}/questions`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
              .then((res) => res.json())
              .then((data) => setQuestions(data))
              .catch((err) => console.error("Failed to reload questions:", err));
          }
        }}
        onError={(error) => setError(error)}
      />
    </DashboardLayout>
  );
}
