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

  const handleAddStudent = async (studentData: any) => {
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      // Create the student user with role 'student'
      const newUser = await usersAPI.create(
        {
          full_name: studentData.name,
          email: studentData.email,
          password: "defaultPassword123!", // You might want to generate a random password or set a default
          role: "student",
          registration_number: studentData.regNumber,
          student_class: studentData.className,
          passport: studentData.passport,
        },
        token
      );

      // If classId is provided, assign student to class
      if (studentData.classId) {
        try {
          await classesAPI.assignStudentToClass(
            studentData.classId,
            newUser.id,
            token
          );
        } catch (classError) {
          console.error("Error assigning student to class:", classError);
          // Continue even if class assignment fails
        }
      }

      // Update the students count
      const updatedStudents = await usersAPI.listStudents(token);
      setTotalStudents(updatedStudents.length);

      // Close the modal
      setIsModalOpen(false);

      // Show success message (you might want to add a toast notification)
      alert("Student created successfully!");
    } catch (error) {
      console.error("Error creating student:", error);
      alert(
        `Failed to create student: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="space-y-8 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add New Student
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "overview"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "classes"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Class Management
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Students
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {totalStudents ?? "--"}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span className="font-medium">+2.5%</span> from last month
              </div>
            </Card>

            <Card className="bg-white border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Teachers
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {totalTeachers ?? "--"}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span className="font-medium">+1.2%</span> from last month
              </div>
            </Card>

            <Card className="bg-white border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Exams
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {activeExams ?? "--"}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span className="font-medium">+3.1%</span> from last month
              </div>
            </Card>
          </div>

          <Card className="border border-gray-200">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => router.push("/dashboard/admin/classes/create")}
                className="group flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-sm w-full"
              >
                <div className="p-3 rounded-full bg-gray-100 text-gray-600 mb-4 group-hover:bg-gray-50 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <span className="font-medium text-gray-800 group-hover:text-blue-600">
                  Create Class
                </span>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Set up a new class with subjects
                </p>
              </button>

              <button
                onClick={() => router.push("/exam/create")}
                className="group flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-sm w-full"
              >
                <div className="p-3 rounded-full bg-gray-100 text-gray-600 mb-4 group-hover:bg-gray-50 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <span className="font-medium text-gray-800 group-hover:text-blue-600">
                  Create Exam
                </span>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Set up a new examination
                </p>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="group flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-sm w-full"
              >
                <div className="p-3 rounded-full bg-gray-100 text-gray-600 mb-4 group-hover:bg-gray-50 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <span className="font-medium text-gray-800 group-hover:text-blue-600">
                  Add Student
                </span>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Register a new student
                </p>
              </button>
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
