"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, getStoredToken } from "@/lib/api";
import { examsAPI, usersAPI, classesAPI } from "@/lib/api/api";
import Link from "next/link";

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

export default function AvailableExamsPage() {
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

    setStudent(currentStudent);

    if (!currentToken) {
      setError("Authentication token missing");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const userWithClass = await usersAPI.getCurrentUser(currentToken);
        setStudent(userWithClass);

        const allExams = await examsAPI.list(currentToken);
        let classSubjectIds: number[] = [];

        if (userWithClass.class_id) {
          try {
            const classDetails = await classesAPI.getClass(
              userWithClass.class_id
            );
            classSubjectIds =
              classDetails.subjects?.map((s: any) => s.id) || [];
          } catch (e) {
            console.warn("Failed to fetch class details:", e);
          }
        }

        const studentExams = allExams.filter((exam: Exam) => {
          if (!exam.published) return false;
          if (
            exam.class_id &&
            userWithClass.class_id &&
            exam.class_id === userWithClass.class_id
          )
            return true;
          if (exam.subject_id && classSubjectIds.includes(exam.subject_id))
            return true;
          return false;
        });

        setExams(studentExams);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load exams:", err);
        setError(err.message || "Failed to load exams");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Available Exams
            </h1>
            <p className="text-gray-600 mt-1">Select an exam to begin</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No exams available
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check back later for new exams or contact your instructor.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="group flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 mr-4">
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {exam.title}
                          </h4>
                          {exam.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {exam.description}
                            </p>
                          )}
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {exam.duration_minutes} minutes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/exam/take/${exam.id}`}
                      className="mt-4 sm:mt-0 w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>Start Exam</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
