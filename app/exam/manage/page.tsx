"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../dashboard/layout";
import { getAllExams, deleteExam } from "../../../lib/db";

export default function ManageExamsPage() {
  const [exams, setExams] = useState<any[]>([]);

  const loadExams = async () => {
    const all = await getAllExams();
    setExams(all);
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleDelete = async (id: number) => {
    await deleteExam(id);
    loadExams();
  };

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-4">Manage Exams</h2>
      {exams.length === 0 && <p>No exams found.</p>}

      <ul className="space-y-4">
        {exams.map((exam) => (
          <li key={exam.id} className="p-4 border rounded-md flex justify-between items-center">
            <span>{exam.title}</span>
            <button
              onClick={() => handleDelete(exam.id)}
              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </DashboardLayout>
  );
}
