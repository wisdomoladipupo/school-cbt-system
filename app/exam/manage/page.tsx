"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../dashboard/layout";
import { getStoredUser, getStoredToken } from "@/lib/api";
import { examsAPI } from "@/lib/api/api";

interface Exam {
  id: number;
  title: string;
  created_by: number;
  published?: boolean;
  description?: string;
  duration_minutes?: number;
}

export default function ManageExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<Record<number, boolean>>({});
  const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  ).replace(/\/$/, "");

  const router = useRouter();
  const user = getStoredUser();
  const token = getStoredToken();

  const checkBackend = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      if (!res.ok) {
        setBackendHealth(
          `Backend unhealthy (status ${res.status}) at ${API_BASE_URL}`
        );
      } else {
        setBackendHealth(`Backend OK at ${API_BASE_URL}`);
      }
    } catch (e: any) {
      setBackendHealth(
        `Cannot reach backend at ${API_BASE_URL}: ${e?.message || e}`
      );
    }
  };

  const loadExams = async () => {
    if (!token) {
      setError("Authentication token missing. Please log in.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await examsAPI.list(token);

      // If teacher, filter exams by classes the teacher is assigned to
      if (user.role === "teacher") {
        try {
          const classes = await (await import("@/lib/api/api")).usersAPI.getMyClasses(token);
          // classes: [{ class_id, class_name, level }]
          if (Array.isArray(classes) && classes.length > 0) {
            const allowedClassIds = new Set(classes.map((c: any) => c.class_id));
            const filtered = data.filter((exam: any) => allowedClassIds.has(exam.class_id));
            setExams(filtered);
          } else {
            // No class assignments -> fall back to server-provided list
            setExams(data);
          }
        } catch (e) {
          console.warn("Failed to fetch teacher classes, falling back to server response", e);
          setExams(data);
        }
      } else {
        setExams(data);
      }

      setError(null);
    } catch (err: any) {
      console.error("Load exams failed:", err);
      setError(
        err.message || "Failed to load exams. Check backend URL or network."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "student") {
      router.replace("/dashboard");
      return;
    }
    checkBackend();
    loadExams();
  }, []);

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await examsAPI.delete(id, token);
      await loadExams(); // refresh list
    } catch (err: any) {
      console.error("Delete exam failed:", err);
      setError(err.message || "Failed to delete exam.");
    }
  };

  const handleViewQuestions = (id: number) => {
    router.push(`/exam/exam?examId=${id}`);
  };

  const handleTogglePublish = async (id: number, currentState: boolean) => {
    if (!token) return;
    try {
      setPublishing({ ...publishing, [id]: true });
      const updated = await examsAPI.togglePublish(id, !currentState, token);
      setExams(exams.map((e) => (e.id === id ? updated : e)));
    } catch (err: any) {
      console.error("Toggle publish failed:", err);
      setError(err.message || "Failed to update exam.");
    } finally {
      setPublishing({ ...publishing, [id]: false });
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-4">Manage Exams</h2>

      <div className="mb-2 text-sm text-gray-500">{backendHealth}</div>
      {loading ? (
        <p>Loading exams...</p>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-red-500">{error}</p>
          <p className="text-xs text-gray-500">API base: {API_BASE_URL}</p>
        </div>
      ) : exams.length === 0 ? (
        <p>No exams found.</p>
      ) : (
        <ul className="space-y-4">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="p-4 border rounded-md flex justify-between items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">
                    {exam.title}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      exam.published
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {exam.published ? "✓ Published" : "Draft"}
                  </span>
                </div>
                {exam.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {exam.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(user.role === "admin" ||
                  (user.role === "teacher" && exam.created_by === user.id)) && (
                  <button
                    onClick={() =>
                      handleTogglePublish(exam.id, exam.published || false)
                    }
                    disabled={publishing[exam.id]}
                    className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                      exam.published
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    } disabled:opacity-50`}
                  >
                    {publishing[exam.id]
                      ? "..."
                      : exam.published
                      ? "Unpublish"
                      : "Publish"}
                  </button>
                )}

                <button
                  onClick={() => handleViewQuestions(exam.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  View Questions
                </button>

                {(user.role === "admin" ||
                  (user.role === "teacher" && exam.created_by === user.id)) && (
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
