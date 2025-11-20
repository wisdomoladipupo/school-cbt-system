"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../layout";
import Modal from "@/components/ui/Modal";
import StudentForm from "@/components/students/studentForm";
import { Student } from "@/components/students/studentCard";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

  const handleAddStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
            <p className="text-3xl font-bold mt-2 text-gray-900">1,240</p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700">Total Teachers</h3>
            <p className="text-3xl font-bold mt-2 text-gray-900">56</p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700">Active Exams</h3>
            <p className="text-3xl font-bold mt-2 text-gray-900">12</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h3>
          <div className="flex gap-4 flex-wrap">
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
              className="px-5 py-3 bg-gray-50 text-gray-700 font-medium rounded-xl shadow hover:bg-gray-100 transition"
              onClick={() => router.push("/dashboard/admin/users")}
            >
              Manage Users
            </button>
          </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Add Student</h3>
          <StudentForm onSubmit={handleAddStudent} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}
