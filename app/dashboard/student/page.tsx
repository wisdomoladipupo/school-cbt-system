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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-8 py-10 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center space-x-6">
              {student.passport ? (
                <img
                  src={student.passport}
                  alt="passport"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-3xl">
                  {student.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Welcome back, {student.full_name.split(" ")[0]}!
                </h1>
                <p className="text-blue-100 mt-1">
                  Ready for your next challenge?
                </p>
              </div>
            </div>
            <div className="mt-6 md:mt-0 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm text-blue-100">Registration Number</p>
              <p className="text-lg font-semibold text-white">
                {student.registration_number || "Not assigned"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Available Exams
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {exams.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Completed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                0
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Average Score
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                -
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ready to take an exam?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            View all available exams and start your test when you're ready.
          </p>
          <button
            onClick={() => router.push("/exam")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>Go to Exams</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
