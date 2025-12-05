"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, getStoredToken } from "@/lib/api";
import { examsAPI, usersAPI, classesAPI } from "@/lib/api/api";

interface Exam {
  id: number;
  title: string;
  description?: string;
  duration_minutes: number;
  published: boolean;
  class_id?: number;
  subject_id?: number;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
  role: string;
  passport?: string | null;
  registration_number?: string | null;
  class_id?: number | null;
}

export default function StudentDashboardPage() {
  const router = useRouter();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    const currentStudent = getStoredUser() as Student | null;
    const currentToken = getStoredToken();

    if (!currentStudent || currentStudent.role !== "student") {
      router.replace("/login");
      return;
    }

    // Use the locally stored user immediately so the UI can render while
    // we refresh server-side user data (including numeric `class_id`).
    setStudent(currentStudent);

    if (!currentToken) {
      setError("Authentication token missing");
      setLoading(false);
      return;
    }

    // Fetch current user info and exams
    const loadData = async () => {
      try {
        setLoading(true);

        // Get current user with class info
        const userWithClass = await usersAPI.getCurrentUser(currentToken);
        setStudent(userWithClass);

        // Debug logs to help diagnose missing exams
        console.debug("Student dashboard: userWithClass=", userWithClass);

        // Fetch all published exams
        const allExams = await examsAPI.list(currentToken);

        // If student has class_id, fetch class subjects to include subject-scoped exams
        let classSubjectIds: number[] = [];
        if (userWithClass.class_id) {
          try {
            const classDetails = await classesAPI.getClass(
              userWithClass.class_id
            );
            classSubjectIds =
              classDetails.subjects?.map((s: any) => s.id) || [];
          } catch (e) {
            console.warn(
              "Failed to fetch class details for student dashboard:",
              e
            );
          }
        }

        // Filter exams for this student's class or subjects
        const studentExams = allExams.filter((exam) => {
          if (!exam.published) return false;
          // exact class match
          if (
            exam.class_id &&
            userWithClass.class_id &&
            exam.class_id === userWithClass.class_id
          )
            return true;
          // subject match where exam may not have class_id set
          if (exam.subject_id && classSubjectIds.includes(exam.subject_id))
            return true;
          return false;
        });
        console.debug(
          "Student dashboard: allExams count=",
          allExams.length,
          "filtered=",
          studentExams.length,
          "classSubjectIds=",
          classSubjectIds
        );
        setExams(studentExams);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (!student) return null;

  // When the UI shows no exams, surface some lightweight debug info so
  // it's easier to understand what's missing (class id, exams count).
  const showDebug = !loading && exams.length === 0;

  return (
    <div className="space-y-8">
      {/* Student Profile */}
      <div className="flex items-center gap-6 bg-white border border-gray-200 rounded-xl shadow p-6">
        <div>
          {student.passport ? (
            <img
              src={student.passport}
              alt="passport"
              className="w-20 h-20 rounded-full object-cover border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-2xl">
              {student.full_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {student.full_name}
          </h2>
          <p className="text-gray-900 font-extrabold text-lg">
            Reg#: {student.registration_number || "(not set)"}
          </p>
          <p className="text-gray-700">Email: {student.email}</p>
          <p className="text-gray-700">
            Role: <span className="capitalize font-medium">{student.role}</span>
          </p>
        </div>
      </div>

      {/* Exams Assigned */}
      <div className="bg-white border border-gray-200 rounded-xl shadow p-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Available Exams</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading exams...</p>
        ) : exams.length === 0 ? (
          showDebug ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">No exams available.</p>
              <p className="text-sm text-yellow-700 mt-2">Debug info:</p>
              <ul className="text-sm text-yellow-700 list-disc list-inside mt-1">
                <li>Student class id: {student.class_id ?? "(none)"}</li>
                <li>Exams shown: {exams.length}</li>
                <li>
                  Make sure exams are published and assigned to your class or
                  subjects.
                </li>
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">No exams available yet.</p>
          )
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{exam.title}</h4>
                  {exam.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {exam.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    ⏱️ {exam.duration_minutes} minutes
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/exam/take/${exam.id}`)}
                  className="ml-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition whitespace-nowrap"
                >
                  Take Exam
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
