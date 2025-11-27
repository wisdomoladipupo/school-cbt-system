"use client";

import { useState, useEffect, useCallback } from "react";
import { getStoredToken } from "@/lib/api";
import {  classesAPI, usersAPI, }  from '@/lib/api/api'
import type { User, Class } from "@/lib/api";

export default function TeacherClassManagement() {
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const token = getStoredToken();
  const messageText =
    typeof message === "string" ? message : JSON.stringify(message);

  const fetchTeacherClasses = useCallback(async () => {
    try {
      // Note: This is a simplified approach. In production, you'd have an endpoint
      // that returns only the current teacher's classes
      const allClasses = await classesAPI.listClasses();
      setMyClasses(allClasses);
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
      const data = await usersAPI.listStudents(token);
      setStudents(data);
    } catch (error) {
      setMessage(
        `Error fetching students: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [token]);

  useEffect(() => {
    fetchTeacherClasses();
  }, [fetchTeacherClasses]);

  useEffect(() => {
    if (token) {
      fetchStudents();
    }
  }, [token, fetchStudents]);

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
      // Build a safe success message
      let successMessage = "Success! Student assigned to class.";
      if (result && typeof result === "object") {
        const eb = result as unknown as Record<string, unknown> | null;
        const parts: string[] = [];
        const subjectsAssigned =
          typeof eb?.["subjects_assigned"] === "number"
            ? (eb!["subjects_assigned"] as number)
            : undefined;
        const examsCreated =
          typeof eb?.["exams_created"] === "number"
            ? (eb!["exams_created"] as number)
            : undefined;
        if (subjectsAssigned !== undefined)
          parts.push(`${subjectsAssigned} subjects assigned`);
        if (examsCreated !== undefined)
          parts.push(`${examsCreated} exams created`);
        if (parts.length > 0) successMessage += " " + parts.join(", ") + ".";
      }
      setMessage(successMessage);
      setSelectedStudent(null);
      await fetchStudents();
    } catch (error) {
      console.error("Teacher assign error:", error);
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Assign Students to Your Classes
      </h2>

      {messageText && (
        <div
          className={`mb-4 p-4 rounded ${
            messageText.includes("Success")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {messageText}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class Selection */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Select Your Class
          </label>
          <select
            value={selectedClass || ""}
            onChange={(e) => setSelectedClass(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">-- Choose a class --</option>
            {myClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>
        </div>

        {/* Student Selection */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Select Student to Assign
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

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ℹ️ When you assign a student to a class, exams for all subjects in
          that class will be automatically created.
        </p>
      </div>
    </div>
  );
}
