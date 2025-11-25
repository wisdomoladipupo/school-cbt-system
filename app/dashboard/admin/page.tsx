"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import StudentForm from "@/components/students/studentForm";
import AdminClassManagementEnhanced from "@/components/admin/ClassManagementEnhanced";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "classes">("overview");

  const handleAddStudent = () => {
    setIsModalOpen(false);
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
              <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700">
                  Total Students
                </h3>
                <p className="text-3xl font-bold mt-2 text-gray-900">1,240</p>
              </div>

              <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700">
                  Total Teachers
                </h3>
                <p className="text-3xl font-bold mt-2 text-gray-900">56</p>
              </div>

              <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700">
                  Active Exams
                </h3>
                <p className="text-3xl font-bold mt-2 text-gray-900">12</p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Quick Actions
              </h3>
              <div className="flex gap-4 flex-wrap">
                <button
                  className="px-5 py-3 bg-purple-50 text-purple-700 font-medium rounded-xl shadow hover:bg-purple-100 transition"
                  onClick={() => router.push("/dashboard/admin/classes/create")}
                >
                  Create New Class
                </button>

                <button
                  className="px-5 py-3 bg-blue-50 text-blue-700 font-medium rounded-xl shadow hover:bg-blue-100 transition"
                  onClick={() => router.push("/exam/create")}
                >
                  Create New Exam
                </button>

                <button
                  className="px-5 py-3 bg-green-50 text-green-700 font-medium rounded-xl shadow hover:bg-green-100 transition"
                  onClick={() => setIsModalOpen(true)}
                >
                  Register Student
                </button>

                <button
                  onClick={() => router.push("/dashboard/admin/users")}
                  className="px-5 py-3 bg-indigo-600 text-white font-medium rounded-xl shadow hover:bg-indigo-700 transition"
                >
                  Manage Users
                </button>
              </div>
            </div>
          </>
        )}

        {/* Class Management Tab */}
        {activeTab === "classes" && <AdminClassManagementEnhanced />}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Add Student
          </h3>
          <StudentForm onSubmit={handleAddStudent} />
        </Modal>
      </div>
  );
}
