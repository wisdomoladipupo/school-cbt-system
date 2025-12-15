// lib/api.ts
// API Client for School CBT System

import type {
  LoginCredentials,
  RegisterPayload,
  TokenResponse,
  User,
  ExamCreate,
  Exam,
  QuestionCreate,
  Question,
  ResultSubmit,
  Result,
  Class,
  ClassWithSubjects,
  Subject,
  SchoolLevel,
} from "./types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

import { getStoredToken } from "./token";

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  register: async (payload: RegisterPayload): Promise<TokenResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Registration failed");
    }

    return response.json();
  },

  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      // Try to extract JSON detail, fallback to text
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        try {
          body = await response.text();
        } catch {
          body = null;
        }
      }

      const bodyObj =
        typeof body === "object" && body !== null
          ? (body as Record<string, unknown>)
          : null;
      const detail = bodyObj ? bodyObj["detail"] ?? bodyObj["message"] : body;
      const message =
        typeof detail === "string"
          ? detail
          : body
          ? JSON.stringify(body)
          : `Login failed (status ${response.status})`;

      throw new Error(message);
    }

    return response.json();
  },
};

// ============================================
// USERS API
// ============================================

export const usersAPI = {
  getCurrentUser: async (token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get current user");
    }

    return response.json();
  },

  create: async (payload: RegisterPayload, token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/users/`, {
      // note trailing slash
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "User creation failed");
    }

    return response.json();
  },

  list: async (token: string): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Try to extract server error details
        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = await response.text();
        }
        const b = body as Record<string, unknown> | string | null;
        const detail =
          (typeof b === "object" && b !== null && (b.detail ?? b.message)) ?? b;
        const message =
          typeof detail === "string" ? detail : JSON.stringify(detail);
        throw new Error(
          message || `Failed to fetch users (status ${response.status})`
        );
      }

      return response.json();
    } catch (err) {
      // Network or parsing error
      if (err instanceof Error) throw err;
      throw new Error("Failed to fetch users");
    }
  },

  update: async (
    userId: number,
    updates: {
      full_name?: string;
      password?: string;
      role?: string;
      passport?: string;
    },
    token: string
  ): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "User update failed");
    }

    return response.json();
  },

  delete: async (
    userId: number,
    token: string
  ): Promise<{ detail: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "User deletion failed");
    }

    return response.json();
  },

  listStudents: async (token: string): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/students/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = await response.text();
        }
        const b = body as Record<string, unknown> | string | null;
        const detail =
          (typeof b === "object" && b !== null && (b.detail ?? b.message)) ?? b;
        const message =
          typeof detail === "string" ? detail : JSON.stringify(detail);
        throw new Error(
          message || `Failed to fetch students (status ${response.status})`
        );
      }

      return response.json();
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Failed to fetch students");
    }
  },

  getTeacherAssignments: async (token: string): Promise<any[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/users/teacher-assignments`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch teacher assignments");
    }
    return response.json();
  },

  getMyAssignments: async (token: string): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me/assignments`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch my assignments");
    }
    return response.json();
  },
  getMyClasses: async (token: string): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me/classes`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch my classes");
    }
    return response.json();
  },
};

export const examsAPI = {
  create: async (payload: ExamCreate, token: string): Promise<Exam> => {
    const res = await fetch(`${API_BASE_URL}/api/exams/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Exam creation failed");
    }
    return res.json();
  },

  list: async (token: string): Promise<Exam[]> => {
    const res = await fetch(`${API_BASE_URL}/api/exams/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.detail || `Failed to fetch exams (status ${res.status})`
      );
    }
    return res.json();
  },

  listAll: async (token: string): Promise<Exam[]> => {
    const res = await fetch(`${API_BASE_URL}/api/exams/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.detail || `Failed to fetch all exams (status ${res.status})`
      );
    }
    return res.json();
  },

  getById: async (examId: number, token?: string): Promise<Exam> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/exams/${examId}`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.detail || `Failed to fetch exam (status ${res.status})`
      );
    }
    return res.json();
  },

  delete: async (examId: number, token: string) => {
    const res = await fetch(`${API_BASE_URL}/api/exams/${examId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.detail || `Failed to delete exam (status ${res.status})`
      );
    }
    return res.json();
  },

  importFromDocument: async (examId: number, file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${API_BASE_URL}/api/exams/import-from-document/${examId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // Content-Type auto
        body: formData,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.detail || `Failed to import questions (status ${res.status})`
      );
    }
    return res.json();
  },

  togglePublish: async (
    examId: number,
    publish: boolean,
    token: string
  ): Promise<Exam> => {
    const res = await fetch(`${API_BASE_URL}/api/exams/${examId}/publish`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ published: publish }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.detail || `Failed to update exam (status ${res.status})`
      );
    }
    return res.json();
  },
};

// ============================================
// QUESTIONS API
// ============================================

export const questionsAPI = {
  create: async (payload: QuestionCreate, token: string): Promise<Question> => {
    const response = await fetch(`${API_BASE_URL}/api/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Question creation failed");
    }

    return response.json();
  },

  // Get all questions for an exam
  getForExam: async (examId: number, token: string) => {
    const res = await fetch(`${API_BASE_URL}/api/exams/${examId}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to fetch questions");
    }
    return res.json(); // should return an array of questions
  },

  uploadImage: async (
    file: File,
    token: string
  ): Promise<{ image_url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/questions/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Image upload failed");
    }

    return response.json();
  },
};

// ============================================
// RESULTS API
// ============================================

export const resultsAPI = {
  submit: async (payload: ResultSubmit, token: string): Promise<Result> => {
    const response = await fetch(`${API_BASE_URL}/api/results/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Result submission failed");
    }

    return response.json();
  },

  getMyResults: async (token: string): Promise<Result[]> => {
    const response = await fetch(`${API_BASE_URL}/api/results/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch results");
    }

    return response.json();
  },

  getForExam: async (examId: number, token: string): Promise<Result[]> => {
    const response = await fetch(`${API_BASE_URL}/api/results/exam/${examId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch exam results");
    }

    return response.json();
  },
};

// ============================================
// CLASSES & SUBJECTS API
// ============================================

export interface SchoolLevel {
  code: string;
  display_name: string;
}

export const classesAPI = {
  getSchoolLevels: async (): Promise<SchoolLevel[]> => {
    const response = await fetch(`${API_BASE_URL}/api/classes/levels`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch school levels");
    return response.json();
  },

  listClasses: async (): Promise<Class[]> => {
    const response = await fetch(`${API_BASE_URL}/api/classes`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch classes");
    return response.json();
  },

  getClass: async (classId: number): Promise<ClassWithSubjects> => {
    const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch class");
    return response.json();
  },

  getClassesByLevel: async (level: string): Promise<Class[]> => {
    const response = await fetch(`${API_BASE_URL}/api/classes/level/${level}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch classes by level");
    return response.json();
  },

  // ------------------
  //   CREATE CLASS
  // ------------------
  createClass: async (
    data: { name: string; level: string },
    token: string
  ): Promise<Class> => {
    const response = await fetch(`${API_BASE_URL}/api/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create class");
    }

    return response.json();
  },

  // ------------------
  //   UPDATE CLASS
  // ------------------
  updateClass: async (
    classId: number,
    data: { name: string; level: string },
    token: string
  ): Promise<Class> => {
    const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update class");
    }

    return response.json();
  },

  // ------------------
  //   SUBJECT UPDATES
  // ------------------

  updateClassSubjects: async (
    classId: number,
    subjectIds: number[],
    token: string
  ): Promise<ClassWithSubjects> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/subjects`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subjectIds),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update class subjects");
    }

    return response.json();
  },

  addSubjectToClass: async (
    classId: number,
    subjectId: number,
    token: string
  ): Promise<ClassWithSubjects> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/subjects/${subjectId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to add subject to class");
    }

    return response.json();
  },

  removeSubjectFromClass: async (
    classId: number,
    subjectId: number,
    token: string
  ): Promise<ClassWithSubjects> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/subjects/${subjectId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to remove subject from class");
    }

    return response.json();
  },
  assignStudentToClass: async (
    classId: number,
    studentId: number,
    token: string
  ): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/assign-student`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: studentId }),
      }
    );
    if (!response.ok) {
      // Try to surface server-provided error details when available
      let body: any = null;
      try {
        body = await response.json();
      } catch {
        try {
          body = await response.text();
        } catch {
          body = null;
        }
      }

      const serverMsg =
        body && typeof body === "object" ? body.detail || body.message : body;

      // Map server message about existing assignment to a user-friendly, consistent message
      if (serverMsg && typeof serverMsg === "string" && /already assigned/i.test(serverMsg)) {
        throw new Error("students already assigned to a class");
      }

      throw new Error(
        (serverMsg && typeof serverMsg === "string" ? serverMsg : "Failed to assign student to class")
      );
    }

    return response.json();
  },

  listSubjects: async (): Promise<Subject[]> => {
    const response = await fetch(`${API_BASE_URL}/api/classes/subjects`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch subjects");
    return response.json();
  },

  getClassSubjectsWithTeachers: async (classId: number): Promise<any[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/subjects-with-teachers`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch subjects with teachers");
    return response.json();
  },

  assignTeacherToSubject: async (
    classId: number,
    teacherId: number,
    subjectId: number,
    token: string
  ): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/assign-teacher-to-subject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teacher_id: teacherId,
          subject_id: subjectId,
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to assign teacher to subject");
    return response.json();
  },

  // Teacher request to teach a subject in a class
  requestTeacherSubject: async (
    classId: number,
    subjectId: number,
    token: string
  ): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/request-teacher-subject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject_id: subjectId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to request subject assignment");
    }
    return response.json();
  },

  // Admin: list pending teacher requests
  listTeacherRequests: async (token: string): Promise<any[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/teacher-requests`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch teacher requests");
    }
    return response.json();
  },

  // Admin: approve a teacher request
  approveTeacherRequest: async (
    requestId: number,
    token: string
  ): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/teacher-requests/${requestId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to approve request");
    }
    return response.json();
  },

  // Admin: reject a teacher request
  rejectTeacherRequest: async (
    requestId: number,
    token: string
  ): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/teacher-requests/${requestId}/reject`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to reject request");
    }
    return response.json();
  },
};
