"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import StudentForm from "@/components/students/studentForm";
import AdminClassManagementEnhanced from "@/components/admin/ClassManagementEnhanced";
import { usersAPI, examsAPI } from "@/lib/api/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "classes">(
    "overview"
  );

  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalTeachers, setTotalTeachers] = useState<number | null>(null);
  const [activeExams, setActiveExams] = useState<number | null>(null);
  const [token, setToken] = useState<string>("");

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) setToken(storedToken);
  }, []);

  // Fetch overview stats
  useEffect(() => {
    if (!token) return;

    const fetchOverview = async () => {
      try {
        const students = await usersAPI.listStudents(token);
        setTotalStudents(students.length);

        const users = await usersAPI.list(token);
        setTotalTeachers(users.filter((u) => u.role === "teacher").length);

        const exams = await examsAPI.list(token);
        setActiveExams(exams.length);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    };

    fetchOverview();
  }, [token]);

  const handleAddStudent = () => {
    setIsModalOpen(false);
    // Optionally refresh students count after adding
    if (token) {
      usersAPI.listStudents(token).then((s) => setTotalStudents(s.length));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>

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
          Class Management
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
              <p className="text-3xl font-bold mt-2 text-gray-900">{totalStudents ?? "--"}</p>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-700">Total Teachers</h3>
              <p className="text-3xl font-bold mt-2 text-gray-900">{totalTeachers ?? "--"}</p>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-700">Active Exams</h3>
              <p className="text-3xl font-bold mt-2 text-gray-900">{activeExams ?? "--"}</p>
            </Card>
          </div>

          <Card>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h3>
            <div className="flex gap-4 flex-wrap">
              <Button onClick={() => router.push("/dashboard/admin/classes/create")} className="px-5 py-3" variant="secondary">
                Create New Class
              </Button>

              <Button onClick={() => router.push("/exam/create")} className="px-5 py-3" variant="secondary">
                Create New Exam
              </Button>

              <Button onClick={() => setIsModalOpen(true)} className="px-5 py-3" variant="ghost">
                Register Student
              </Button>

              <Button onClick={() => router.push("/dashboard/admin/users")} className="px-5 py-3" variant="primary">
                Manage Users
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Class Management Tab */}
      {activeTab === "classes" && <AdminClassManagementEnhanced />}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Add Student
        </h3>
        <StudentForm onSubmit={handleAddStudent} />
      </Modal>
    </div>
  );
}
