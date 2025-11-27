"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import StudentList from "@/components/students/studentList";
import StudentForm from "@/components/students/studentForm";
import TeacherClassManagement from "@/components/teacher/ClassManagement";
import Modal from "@/components/ui/Modal";
import { Student } from "@/components/students/studentCard";
import { getStoredToken, User } from "@/lib/api";
import { usersAPI } from "@/lib/api/api";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "classes">(
    "overview"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = getStoredToken();
        if (!token) {
          setError("Not authenticated");
          router.push("/auth/login");
          return;
        }

        const users = await usersAPI.listStudents(token);
        // Convert User[] to Student[]
        const studentList: Student[] = users.map((u: User) => ({
          id: u.id,
          regNumber: u.registration_number || `STU-${u.id}`,
          name: u.full_name,
          email: u.email,
          className: u.student_class || "Unassigned",
        }));
        setStudents(studentList);
        setError("");
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch students"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [router]);

  const handleAddOrUpdate = (student: Student) => {
    setStudents((prev) => {
      const exists = prev.find((s) => s.id === student.id);
      if (exists) {
        return prev.map((s) => (s.id === student.id ? student : s));
      }
      return [...prev, student];
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Teacher Dashboard</h2>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "overview"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "classes"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Manage Classes
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700">
                Classes Assigned
              </h3>
              <p className="text-3xl font-bold mt-2 text-gray-900">4</p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700">
                Exams Created
              </h3>
              <p className="text-3xl font-bold mt-2 text-gray-900">19</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Actions
            </h3>
            <div className="flex gap-4 flex-wrap">
              <button
                className="px-5 py-3 bg-blue-50 text-blue-700 font-medium rounded-xl shadow hover:bg-blue-100 transition"
                onClick={() => setIsModalOpen(true)}
              >
                Add Student
              </button>

              <button
                className="px-5 py-3 bg-green-50 text-green-700 font-medium rounded-xl shadow hover:bg-green-100 transition"
                onClick={() => router.push("/exam/create")}
              >
                Create Exam
              </button>

              <button className="px-5 py-3 bg-gray-50 text-gray-700 font-medium rounded-xl shadow hover:bg-gray-100 transition">
                Grade Results
              </button>
            </div>
          </div>

          {/* Error or Student List */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading students...
            </div>
          ) : (
            <StudentList students={students} onEdit={handleAddOrUpdate} />
          )}
        </>
      )}

      {/* Classes Tab */}
      {activeTab === "classes" && <TeacherClassManagement />}

      {/* Modal for Add Student */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Add Student
        </h3>
        <StudentForm onSubmit={handleAddOrUpdate} />
      </Modal>
    </div>
  );
}
