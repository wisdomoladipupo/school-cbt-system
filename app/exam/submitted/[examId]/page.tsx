"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../dashboard/layout";
import { getStoredToken, getStoredUser } from "@/lib/api";
import { resultsAPI, examsAPI } from "@/lib/api/api";

export default function ExamSubmittedPage() {
  const params = useParams();
  const router = useRouter();
  const examId = Number(params.examId);

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any | null>(null);
  const [examTitle, setExamTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentUser = getStoredUser() as any | null;
  const userRole = currentUser?.role;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = getStoredToken();
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      try {
        const myResults = await resultsAPI.getMyResults(token);
        const found = myResults.find(
          (r: any) => r.exam_id === examId || r.examId === examId
        );
        if (found) {
          setResult(found);
        }

        try {
          const exam = await examsAPI.getById(examId);
          setExamTitle(exam.title || null);
        } catch (e) {
          // ignore exam fetch errors
        }

        if (!found) {
          // If not found, still show a friendly message — submission may take time
          setError(
            "Submission recorded but result not yet available. Check Results page shortly."
          );
        }
      } catch (e: any) {
        setError(e.message || "Failed to load submission info");
      } finally {
        setLoading(false);
      }
    };

    if (examId) load();
  }, [examId]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Exam Submitted</h1>

        {loading ? (
          <p>Loading submission...</p>
        ) : (
          <div className="space-y-4">
            {result ? (
              <div className="p-4 bg-white border rounded">
                <h2 className="font-semibold text-lg">
                  {examTitle || `Exam ${examId}`}
                </h2>
                <p className="text-sm text-gray-600">Submitted successfully.</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="text-xl font-bold">{result.score ?? 0}</div>
                  <div className="text-sm text-gray-600">
                    / {result.max_score ?? result.max ?? 0}
                  </div>
                </div>
                <div className="mt-3">
                  {userRole && userRole !== "student" && (
                    <button
                      onClick={() => router.push("/results")}
                      className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
                    >
                      View Results
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/dashboard/student")}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border rounded">
                <p className="text-yellow-800">
                  {error || "Submission recorded."}
                </p>
                <div className="mt-3">
                  {userRole && userRole !== "student" && (
                    <button
                      onClick={() => router.push("/results")}
                      className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
                    >
                      Go to Results
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/dashboard/student")}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
