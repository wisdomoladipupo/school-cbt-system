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
  class_id?: number;
  subject_id?: number;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Class {
  id: number;
  name: string;
  level: string;
}

export default function ManageExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<Record<number, boolean>>({});
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    duration_minutes: number;
    class_id: number | null;
    subject_id: number | null;
  }>({
    title: "",
    description: "",
    duration_minutes: 30,
    class_id: null,
    subject_id: null,
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
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
          const classes = await (
            await import("@/lib/api/api")
          ).usersAPI.getMyClasses(token);
          // classes: [{ class_id, class_name, level }]
          if (Array.isArray(classes) && classes.length > 0) {
            const allowedClassIds = new Set(
              classes.map((c: any) => c.class_id)
            );
            const filtered = data.filter((exam: any) =>
              allowedClassIds.has(exam.class_id)
            );
            setExams(filtered);
          } else {
            // No class assignments -> fall back to server-provided list
            setExams(data);
          }
        } catch (e) {
          console.warn(
            "Failed to fetch teacher classes, falling back to server response",
            e
          );
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

  const loadClassesAndSubjects = async () => {
    try {
      const { classesAPI } = await import("@/lib/api/api");
      const c = await classesAPI.listClasses();
      const s = await classesAPI.listSubjects();
      setClasses(c);
      setSubjects(s);
    } catch (err) {
      console.error("Failed to load classes/subjects:", err);
    }
  };

  const openEditModal = async (exam: Exam) => {
    await loadClassesAndSubjects();
    setEditingExamId(exam.id);
    setEditFormData({
      title: exam.title,
      description: exam.description || "",
      duration_minutes: exam.duration_minutes || 30,
      class_id: exam.class_id || null,
      subject_id: exam.subject_id || null,
    });
    if (exam.class_id) {
      const classInfo = classes.find((c) => c.id === exam.class_id);
      if (classInfo) {
        const classSubs = subjects.filter((s) => true); // In a real app, filter based on class
        setClassSubjects(classSubs);
      }
    }
  };

  const saveExamChanges = async () => {
    if (!token || !editingExamId) return;
    try {
      setIsSavingEdit(true);
      const updated = await examsAPI.update(editingExamId, editFormData, token);
      setExams(exams.map((e) => (e.id === editingExamId ? updated : e)));
      setEditingExamId(null);
      setError(null);
    } catch (err: any) {
      console.error("Save exam failed:", err);
      setError(err.message || "Failed to save exam changes.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Exams</h2>
            <p className="mt-1 text-sm text-gray-500">
              View and manage all examination papers
            </p>
          </div>
          {backendHealth && (
            <div className="mt-2 sm:mt-0 text-xs text-gray-500">
              {backendHealth}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <p className="mt-1 text-xs text-red-500">
                  API base: {API_BASE_URL}
                </p>
              </div>
            </div>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No exams</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new exam.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {exam.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        exam.published
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {exam.published ? "✓ Published" : "Draft"}
                    </span>
                  </div>

                  {exam.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {exam.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg
                        className="shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {exam.duration_minutes || 30} min
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 px-5 py-3 flex flex-wrap gap-2 justify-end border-t border-gray-200">
                  <button
                    onClick={() => handleViewQuestions(exam.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    View Questions
                  </button>

                  {(user.role === "admin" ||
                    (user.role === "teacher" &&
                      exam.created_by === user.id)) && (
                    <>
                      <button
                        onClick={() => openEditModal(exam)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleTogglePublish(exam.id, exam.published || false)
                        }
                        disabled={publishing[exam.id]}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                          exam.published
                            ? "text-orange-700 bg-orange-100 hover:bg-orange-200 focus:ring-orange-500"
                            : "text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500"
                        } disabled:opacity-50`}
                      >
                        {publishing[exam.id] ? (
                          <span>Processing...</span>
                        ) : exam.published ? (
                          <span>Unpublish</span>
                        ) : (
                          <span>Publish</span>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(exam.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingExamId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Edit Exam</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={editFormData.duration_minutes}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        duration_minutes: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    value={editFormData.class_id || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        class_id: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-700"
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={editFormData.subject_id || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        subject_id: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-700"
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingExamId(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveExamChanges}
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
