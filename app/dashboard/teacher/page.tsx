"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../layout";

import StudentList from "@/components/students/studentList";
import StudentForm from "@/components/students/studentForm";
import Modal from "@/components/ui/Modal";
import { Student } from "@/components/students/studentCard";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddOrUpdate = (student: Student) => {
    setStudents((prev) => {
      const exists = prev.find((s) => s.id === student.id);
      if (exists) {
        return prev.map((s) => (s.id === student.id ? student : s));
      }
      return [...prev, student];
    });
    setIsModalOpen(false); // close modal after adding
  };

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Teacher Dashboard</h2>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700">Classes Assigned</h3>
            <p className="text-3xl font-bold mt-2 text-gray-900">4</p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700">Exams Created</h3>
            <p className="text-3xl font-bold mt-2 text-gray-900">19</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 bg-white rounded-2xl shadow border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Actions</h3>
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

        {/* Student List */}
        <StudentList students={students} onEdit={handleAddOrUpdate} />

        {/* Modal for Add Student */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Add Student</h3>
          <StudentForm onSubmit={handleAddOrUpdate} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}
