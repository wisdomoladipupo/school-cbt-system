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
                  <>
                    <button
                      onClick={() => openEditModal(exam)}
                      className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                    >
                      Edit
                    </button>
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
                  </>
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
                    setEditFormData({ ...editFormData, title: e.target.value })
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
                      class_id: e.target.value ? parseInt(e.target.value) : null,
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
                      subject_id: e.target.value ? parseInt(e.target.value) : null,
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
    </DashboardLayout>
  );
}
