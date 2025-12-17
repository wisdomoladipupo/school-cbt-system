"use client";

import { useState, useEffect, useCallback } from "react";
import { classesAPI, usersAPI } from "@/lib/api/api";
import { getStoredToken } from "@/lib/api/token";
import type {
  User,
  Class,
  Subject,
  SubjectWithTeachers,
  SchoolLevel as SchoolLevelType,
  ClassWithSubjects,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";

// Define result types for API calls
interface AssignStudentResult {
  subjects_assigned?: number;
  exams_created?: number;
}

interface AssignTeacherResult {
  message?: string;
}

export default function AdminClassManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "students" | "teachers" | "details"
  >("students");
  const [classes, setClasses] = useState<Class[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevelType[]>([]);

  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [classDetails, setClassDetails] = useState<ClassWithSubjects | null>(
    null
  );
  const [subjectsWithTeachers, setSubjectsWithTeachers] = useState<
    SubjectWithTeachers[]
  >([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);

  const token = getStoredToken();
  const messageText =
    typeof message === "string" ? message : JSON.stringify(message);

  // ----------------------
  // FETCH FUNCTIONS
  // ----------------------
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

  const fetchSchoolLevels = useCallback(async () => {
    try {
      const levels = await classesAPI.getSchoolLevels();
      setSchoolLevels(levels);
    } catch (error) {
      console.error("Failed to fetch school levels:", error);
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

  const fetchTeachers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await usersAPI.list(token);
      setTeachers(data.filter((u) => u.role === "teacher"));
    } catch (error) {
      setMessage(
        `Error fetching teachers: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [token]);

  const fetchClassDetails = useCallback(async (classId: number) => {
    try {
      const details = await classesAPI.getClass(classId);
      setClassDetails(details);
      const subjectData = await classesAPI.getClassSubjectsWithTeachers(
        classId
      );
      setSubjectsWithTeachers(subjectData as SubjectWithTeachers[]);
    } catch (error) {
      setMessage(
        `Error fetching class details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  const fetchAllSubjects = useCallback(async () => {
    try {
      const subs = await classesAPI.listSubjects();
      setAllSubjects(subs);
    } catch (error) {
      console.error("Failed to fetch all subjects:", error);
    }
  }, []);

  // Teacher requests feature removed from admin UI

  // ----------------------
  // EFFECTS
  // ----------------------
  useEffect(() => {
    fetchClasses();
    fetchSchoolLevels();
  }, [fetchClasses, fetchSchoolLevels]);

  useEffect(() => {
    if (token) {
      fetchStudents();
      fetchTeachers();
      // fetch teacher assignments for admin overview of teacher->subject mappings
      (async () => {
        try {
          const ta = await usersAPI.getTeacherAssignments(token);
          setTeacherAssignments(ta);
        } catch (err) {
          console.error("Failed to fetch teacher assignments:", err);
        }
      })();
    }
  }, [token, fetchStudents, fetchTeachers]);

  useEffect(() => {
    if (selectedClass !== null) {
      fetchClassDetails(selectedClass);
    }
  }, [selectedClass, fetchClassDetails]);

  useEffect(() => {
    fetchAllSubjects();
  }, [fetchAllSubjects]);

  // Load class details when switching to details tab
  useEffect(() => {
    if (activeTab === "details" && selectedClass !== null) {
      fetchClassDetails(selectedClass);
    }
    // When opening the Teachers tab, ensure class details are fresh
    if (activeTab === "teachers" && selectedClass !== null) {
      fetchClassDetails(selectedClass);
    }
  }, [activeTab]);

  // ----------------------
  // SUBJECT MODAL
  // ----------------------
  const openSubjectsModal = () => {
    if (!classDetails) return;
    const ids = classDetails.subjects?.map((s) => s.id) || [];
    setSelectedSubjectIds(ids);
    setIsSubjectsModalOpen(true);
  };

  const toggleSubjectSelection = (id: number) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSaveSubjects = async () => {
    if (!selectedClass || !token) {
      setMessage("Missing class or auth token");
      return;
    }
    setLoading(true);
    try {
      const updated = await classesAPI.updateClassSubjects(
        selectedClass,
        selectedSubjectIds,
        token
      );
      setClassDetails(updated);
      setMessage("Success! Class subjects updated.");
      setIsSubjectsModalOpen(false);
      // Refresh details and global subjects list
      fetchClassDetails(selectedClass);
      fetchAllSubjects();
    } catch (error) {
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // STUDENT ASSIGNMENT
  // ----------------------
  const handleAssignStudent = async () => {
    if (!selectedClass || !selectedStudent || !token) {
      setMessage("Please select both a class and a student");
      return;
    }

    setLoading(true);
    try {
      const result = (await classesAPI.assignStudentToClass(
        selectedClass,
        selectedStudent,
        token
      )) as AssignStudentResult;

      let successMessage = "Success! Student assigned to class.";
      const parts = [];
      if (result.subjects_assigned !== undefined)
        parts.push(`${result.subjects_assigned} subjects assigned`);
      if (result.exams_created !== undefined)
        parts.push(`${result.exams_created} exams created`);
      if (parts.length > 0) successMessage += " " + parts.join(", ") + ".";

      setMessage(successMessage);
      setSelectedStudent(null);
      fetchStudents();
      fetchClassDetails(selectedClass);
    } catch (error) {
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // TEACHER ASSIGNMENT
  // ----------------------
  const handleAssignTeacherToSubject = async () => {
    if (!selectedClass || !selectedTeacher || !selectedSubject || !token) {
      setMessage("Please select a class, teacher, and subject");
      return;
    }

    setLoading(true);
    try {
      // If subject isn't assigned to the class yet, add it automatically
      const classSubjIds = classDetails?.subjects?.map((s) => s.id) || [];
      if (!classSubjIds.includes(selectedSubject)) {
        try {
          setMessage("Subject not assigned to class — adding it now...");
          await classesAPI.addSubjectToClass(
            selectedClass,
            selectedSubject,
            token
          );
          // Refresh class details so UI reflects the change
          await fetchClassDetails(selectedClass);
          await fetchAllSubjects();
          setMessage("Subject added to class. Proceeding to assign teacher...");
        } catch (err) {
          setMessage(
            `Failed to add subject to class: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          setLoading(false);
          return;
        }
      }
      const result = (await classesAPI.assignTeacherToSubject(
        selectedClass,
        selectedTeacher,
        selectedSubject,
        token
      )) as AssignTeacherResult;

      setMessage(
        `Success! Teacher assigned to subject. ${result.message || ""}`
      );
      setSelectedTeacher(null);
      setSelectedSubject(null);
      fetchClassDetails(selectedClass);
    } catch (error) {
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // TEACHER REQUEST HANDLERS
  // ----------------------
  // Approve/reject handlers removed (teacher-request flow disabled in UI)

  // ----------------------
  // RENDER
  // ----------------------
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Manage Classes, Teachers & Students
        </h2>
        <button
          onClick={() => router.push("/dashboard/admin/classes/create")}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:brightness-90 transition"
        >
          + Create New Class
        </button>
      </div>

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

      {/* Class Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block mb-2 font-semibold text-gray-700">
          Select Class to Manage
        </label>
        <select
          value={selectedClass ?? ""}
          onChange={(e) => {
            const val = Number(e.target.value);
            setSelectedClass(isNaN(val) ? null : val);
            setActiveTab("students");
          }}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">-- Choose a class --</option>
          {schoolLevels.map((level) => {
            const classesInLevel = classes.filter(
              (c) => c.level === level.code
            );
            if (classesInLevel.length === 0) return null;
            return (
              <optgroup key={level.code} label={level.display_name}>
                {classesInLevel.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <p className="text-sm text-gray-600 mt-2">
          Classes organized by Nigerian school system levels
        </p>
      </div>

      {selectedClass !== null && (
        <>
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("students")}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === "students"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab("teachers")}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === "teachers"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Teachers & Subjects
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === "details"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Class Details
            </button>
            {/* Teacher Requests tab removed */}
          </div>

          {/* Students Tab */}
          {activeTab === "students" && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Assign Student to Class
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Select Student
                    </label>
                    <select
                      value={selectedStudent || ""}
                      onChange={(e) =>
                        setSelectedStudent(Number(e.target.value) || null)
                      }
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

                  <button
                    onClick={handleAssignStudent}
                    disabled={!selectedStudent || loading}
                    className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {loading ? "Assigning..." : "Assign Student to Class"}
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded text-sm text-blue-800">
                  ℹ️ Assigning a student to a class will automatically:
                  <ul className="list-disc list-inside mt-2">
                    <li>Create student-subject relationships</li>
                    <li>Generate exams for all class subjects</li>
                  </ul>
                </div>
              </div>

              {/* Display class students if available */}
              {classDetails &&
                classDetails.students &&
                classDetails.students.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Students in {classDetails.name}
                    </h3>
                    <div className="space-y-2">
                      {classDetails.students.map((student: User) => (
                        <div
                          key={student.id}
                          className="p-3 bg-white border border-gray-200 rounded-lg"
                        >
                          <p className="font-medium text-gray-900">
                            {student.full_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {student.email}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Teachers & Subjects Tab */}
          {activeTab === "teachers" && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Assign Teacher to Subject
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Select Teacher
                    </label>
                    <select
                      value={selectedTeacher || ""}
                      onChange={(e) =>
                        setSelectedTeacher(Number(e.target.value) || null)
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Choose a teacher --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Select Subject
                    </label>
                    <select
                      value={selectedSubject || ""}
                      onChange={(e) =>
                        setSelectedSubject(Number(e.target.value) || null)
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Choose a subject --</option>
                      {allSubjects.map((subj: Subject) => {
                        const assigned = !!classDetails?.subjects?.some(
                          (s) => s.id === subj.id
                        );
                        return (
                          <option key={subj.id} value={subj.id}>
                            {subj.name} ({subj.code})
                            {assigned ? " — assigned" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    onClick={handleAssignTeacherToSubject}
                    disabled={!selectedTeacher || !selectedSubject || loading}
                    className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {loading ? "Assigning..." : "Assign Teacher to Subject"}
                  </button>
                </div>
              </div>

              {/* Subjects with Teachers List */}
              {subjectsWithTeachers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">
                    Subjects & Teachers in {classDetails?.name}
                  </h3>
                  {subjectsWithTeachers.map((subject) => (
                    <div
                      key={subject.subject_id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {subject.subject_name} ({subject.subject_code})
                      </h4>
                      {subject.teachers.length > 0 ? (
                        <div className="space-y-2">
                          {subject.teachers.map((teacher) => (
                            <div
                              key={teacher.id}
                              className="p-2 bg-white border-l-4 border-green-500 rounded"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {teacher.teacher_name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {teacher.teacher_email}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No teachers assigned yet
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* All Teachers Assignments (global view) */}
              {teacherAssignments.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    All Teacher Assignments
                  </h3>
                  <div className="space-y-3">
                    {teacherAssignments.map((t) => (
                      <div
                        key={t.teacher_id}
                        className="p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <p className="font-medium text-gray-900">
                          {t.teacher_name}{" "}
                          <span className="text-xs text-gray-500">
                            ({t.teacher_email})
                          </span>
                        </p>
                        {t.assignments && t.assignments.length > 0 ? (
                          <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                            {t.assignments.map((a: any, idx: number) => (
                              <li key={idx}>
                                {a.subject_name} — {a.class_name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No assignments
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Class Details Tab */}
          {activeTab === "details" && classDetails && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">
                  {classDetails.name}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Level</p>
                    <p className="font-semibold text-gray-900">
                      {classDetails.level}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="font-semibold text-gray-900">
                      {classDetails.students?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Subjects</p>
                    <p className="font-semibold text-gray-900">
                      {classDetails.subjects?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teachers Assigned</p>
                    <p className="font-semibold text-gray-900">
                      {classDetails.teachers?.length || 0}
                    </p>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-800 mb-2">Subjects</h4>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">Subjects</h4>
                  <button
                    onClick={openSubjectsModal}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit Subjects
                  </button>
                </div>
                <div className="space-y-2 mb-6">
                  {classDetails.subjects?.map((subj: Subject) => (
                    <div
                      key={subj.id}
                      className="p-2 bg-white border border-gray-300 rounded"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {subj.name}
                      </p>
                      <p className="text-xs text-gray-600">Code: {subj.code}</p>
                    </div>
                  ))}
                </div>

                <h4 className="font-semibold text-gray-800 mb-2">Teachers</h4>
                <div className="space-y-2">
                  {classDetails.teachers?.map((teacher: User) => (
                    <div
                      key={teacher.id}
                      className="p-2 bg-white border border-gray-300 rounded"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {teacher.full_name}
                      </p>
                      <p className="text-xs text-gray-600">{teacher.email}</p>
                    </div>
                  ))}
                  {(!classDetails.teachers ||
                    classDetails.teachers.length === 0) && (
                    <p className="text-sm text-gray-500 italic">
                      No teachers assigned to this class yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Teacher requests UI removed from admin view */}
        </>
      )}
      {isSubjectsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Edit Subjects for {classDetails?.name}
              </h3>
              <button
                onClick={() => setIsSubjectsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="max-h-64 overflow-auto grid grid-cols-2 gap-3">
              {allSubjects.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 p-2 border rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjectIds.includes(s.id)}
                    onChange={() => toggleSubjectSelection(s.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    {s.name}{" "}
                    <span className="text-xs text-gray-500">({s.code})</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setIsSubjectsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubjects}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Subjects"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
