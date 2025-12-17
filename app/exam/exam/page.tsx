"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "../../dashboard/layout";
import { getStoredToken, getStoredUser } from "@/lib/api";
import { examsAPI, questionsAPI } from "@/lib/api/api";
import ImportQuestionsModal from "@/components/exams/ImportQuestionsModal";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Question | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);

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

  const openEditModal = (question: Question) => {
    setEditingQuestionId(question.id);
    setEditFormData({ ...question });
    setError(null); // Clear any error when opening modal
  };

  const saveQuestionChanges = async () => {
    if (!token || !editFormData || !editingQuestionId) return;
    try {
      setIsSavingEdit(true);
      await questionsAPI.update(editingQuestionId, {
        text: editFormData.text,
        options: editFormData.options,
        correct_answer: editFormData.correct_answer,
        marks: editFormData.marks,
        image_url: editFormData.image_url,
      }, token);
      // Update local state
      setQuestions(questions.map((q) => (q.id === editingQuestionId ? editFormData : q)));
      setEditingQuestionId(null);
      setEditFormData(null);
      setError(null); // Clear any previous errors on successful save
    } catch (err: any) {
      setError(err.message || "Failed to save question changes");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const deleteQuestion = async (questionId: number) => {
    if (!token) return;
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    
    try {
      setDeletingQuestionId(questionId);
      await questionsAPI.delete(questionId, token);
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (err: any) {
      setError(err.message || "Failed to delete question");
    } finally {
      setDeletingQuestionId(null);
    }
  };

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

          <h3 className="text-xl font-semibold mb-4">Questions</h3>
          {questions.length === 0 ? (
            <p>No questions found for this exam.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <Card key={q.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900">
                      {index + 1}. {q.text}
                    </h4>
                    {(user?.role === "teacher" || user?.role === "admin") && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => openEditModal(q)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => deleteQuestion(q.id)}
                          disabled={deletingQuestionId === q.id}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          {deletingQuestionId === q.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {q.image_url && (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${q.image_url}`}
                      alt="Question"
                      className="mb-3 max-h-64 rounded"
                    />
                  )}

                  <div className="mb-3">
                    <p className="text-sm text-gray-600 font-medium mb-2">Options:</p>
                    <ul className="space-y-1">
                      {q.options.map((opt, i) => (
                        <li
                          key={i}
                          className={`text-sm ${
                            i === q.correct_answer
                              ? "text-green-700 font-medium bg-green-50 p-2 rounded"
                              : "text-gray-700"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}) {opt}
                          {i === q.correct_answer && " ✓ (Correct)"}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-sm text-gray-500">Marks: {q.marks}</p>
                </Card>
              ))}
            </div>
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
              .catch((err) =>
                console.error("Failed to reload questions:", err)
              );
          }
        }}
        onError={(error) => setError(error)}
      />

      {/* Edit Question Modal */}
      {editingQuestionId !== null && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-lg overflow-y-auto max-h-96">
            <h3 className="text-lg font-semibold mb-4">Edit Question</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Text
                </label>
                <textarea
                  value={editFormData.text}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, text: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marks
                </label>
                <input
                  type="number"
                  value={editFormData.marks}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      marks: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  {editFormData.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="radio"
                        name="correct"
                        checked={editFormData.correct_answer === i}
                        onChange={() =>
                          setEditFormData({
                            ...editFormData,
                            correct_answer: i,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...editFormData.options];
                          newOptions[i] = e.target.value;
                          setEditFormData({
                            ...editFormData,
                            options: newOptions,
                          });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingQuestionId(null);
                  setEditFormData(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveQuestionChanges}
                disabled={isSavingEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
