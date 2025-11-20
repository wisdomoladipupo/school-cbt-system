"use client";

import DashboardLayout from "../layout";
import { getCurrentUser } from "@/lib/session";

interface Exam {
  id: number;
  title: string;
  className: string; // assigned class
  duration: number; // in minutes
}

interface Student {
  name: string;
  regNumber: string;
  passport?: string;
  className: string;
  email: string;
}

// Example all exams (could later be fetched in a server action or passed as props)
const ALL_EXAMS: Exam[] = [
  { id: 1, title: "Math Quiz", className: "JSS1", duration: 30 },
  { id: 2, title: "English Test", className: "JSS2", duration: 45 },
  { id: 3, title: "Science Exam", className: "JSS1", duration: 60 },
];

export default function StudentDashboardPage() {
  const student = getCurrentUser() as Student | null;

  if (!student) return null; // user not logged in

  // Filter exams assigned to the student's class
  const assignedExams = ALL_EXAMS.filter(
    (exam) => exam.className === student.className
  );

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-8">
        {/* Student Profile */}
        <div className="flex items-center gap-6 bg-white border border-gray-200 rounded-xl shadow p-6">
          {student.passport ? (
            <img
              src={student.passport}
              alt={student.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
              N/A
            </div>
          )}

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
            <p className="text-gray-700">Reg Number: {student.regNumber}</p>
            <p className="text-gray-700">Class: {student.className}</p>
          </div>
        </div>

        {/* Exams Assigned */}
        <div className="bg-white border border-gray-200 rounded-xl shadow p-6 space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Assigned Exams</h3>
          {assignedExams.length === 0 ? (
            <p className="text-gray-500">No exams assigned to your class yet.</p>
          ) : (
            <ul className="space-y-3">
              {assignedExams.map((exam) => (
                <li
                  key={exam.id}
                  className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-indigo-50 transition"
                >
                  <span className="font-medium text-gray-800">{exam.title}</span>
                  <span className="text-gray-600">{exam.duration} mins</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
