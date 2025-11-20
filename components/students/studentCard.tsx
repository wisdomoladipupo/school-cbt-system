// frontend/components/students/StudentCard.tsx
"use client";

import React from "react";

export interface Student {
  id?: number;
  name: string;
  email: string;
  regNumber: string;
  className: string;
}

interface StudentCardProps {
  student: Student;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onEdit, onDelete }) => {
  return (
    <div className="border p-4 rounded shadow-sm bg-white flex justify-between items-center">
      <div>
        <div className="font-semibold">{student.name}</div>
        <div className="text-sm text-gray-600">Email: {student.email}</div>
        <div className="text-sm text-gray-600">Reg: {student.regNumber}</div>
        <div className="text-sm text-gray-600">Class: {student.className}</div>
      </div>

      <div className="flex gap-2">
        {onEdit && (
          <button
            className="px-2 py-1 bg-blue-600 text-white rounded"
            onClick={() => onEdit(student)}
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            className="px-2 py-1 bg-red-600 text-white rounded"
            onClick={() => onDelete(student)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentCard;
