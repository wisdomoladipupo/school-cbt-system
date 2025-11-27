"use client";

import { useState, useEffect, useCallback } from "react";
import { classesAPI, usersAPI, getStoredToken } from "@/lib/api";
import type { User, Class } from "@/lib/api";

export default function AdminClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const token = getStoredToken();

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classesAPI.listClasses();
      setClasses(data);
    } catch (error) {
      setMessage(
        `Error fetching classes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!token) return;
    try {
      const data = await usersAPI.list(token);
      setStudents(data.filter((u) => u.role === "student"));
    } catch (error) {
      setMessage(
        `Error fetching students: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [token]);

  const fetchClassSubjects = useCallback(async (classId: number) => {
    try {
      const cls = await classesAPI.getClass(classId);
      setSubjects(cls.subjects || []);
    } catch (error) {
      setMessage(
        `Error fetching subjects: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (token) {
      fetchStudents();
    }
  }, [token, fetchStudents]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassSubjects(selectedClass);
    }
  }, [selectedClass, fetchClassSubjects]);

  const handleAssignStudent = async () => {
    if (!selectedClass || !selectedStudent || !token) {
      setMessage("Please select both a class and a student");
      return;
    }

    setLoading(true);
    try {
      const result = await classesAPI.assignStudentToClass(
        selectedClass,
        selectedStudent,
        token
      );
      setMessage(
        `Success! Student assigned to class. ${result.subjects_assigned} subjects assigned, ${result.exams_created} exams created.`
      );
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setSubjects(subjects.filter((s) => s !== subject));
  };

  const handleSaveSubjects = async () => {
    if (!selectedClass || !token) return;
    setLoading(true);
    try {
      await classesAPI.updateClassSubjects(selectedClass, subjects, token);
      setMessage("Subjects updated successfully!");
    } catch (error) {
      setMessage(
        `Error updating subjects: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Assign Students to Classes
      </h2>

      {message && (
        <div
          className={`mb-4 p-4 rounded ${
            message.includes("Success")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Select Class
          </label>
          <select
            value={selectedClass || ""}
            onChange={(e) => setSelectedClass(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">-- Choose a class --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Select Student
          </label>
          <select
            value={selectedStudent || ""}
            onChange={(e) => setSelectedStudent(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">-- Choose a student --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} ({s.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleAssignStudent}
        disabled={!selectedClass || !selectedStudent || loading}
        className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? "Assigning..." : "Assign Student to Class"}
      </button>

      {selectedClass && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">
            Class Details & Subjects
          </h3>

          <div className="mb-4">
            <p className="font-semibold text-gray-700 mb-2">Subjects:</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  <span>{subject}</span>
                  <button
                    onClick={() => handleRemoveSubject(subject)}
                    className="text-red-600 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Add new subject"
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleAddSubject}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Add
            </button>
          </div>

          <button
            onClick={handleSaveSubjects}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
          >
            {loading ? "Saving..." : "Save Subjects"}
          </button>
        </div>
      )}
    </div>
  );
}
