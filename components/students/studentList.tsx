// frontend/components/students/StudentList.tsx
"use client";

import React from "react";
import StudentCard, { Student } from "./studentCard";

interface StudentListProps {
  students: Student[];
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onEdit, onDelete }) => {
  if (students.length === 0) return <p>No students found.</p>;

  return (
    <div className="space-y-4">
      {students.map((s) => (
        <StudentCard
          key={s.regNumber}
          student={s}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default StudentList;
