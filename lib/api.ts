// lib/api.ts
// API Client for School CBT System

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================
// TYPES
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  role?: "admin" | "teacher" | "student";
  student_class?: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  student_class?: string;
  registration_number?: string;
}

export interface ExamCreate {
  title: string;
  description?: string;
  duration_minutes?: number;
  published?: boolean;
  class_id?: number;
  subject_id?: number;
}

export interface Exam {
  id: number;
  title: string;
  description?: string;
  duration_minutes: number;
  published: boolean;
  created_by: number;
  class_id?: number;
  subject_id?: number;
}

export interface QuestionCreate {
  exam_id?: number;
  text: string;
  options: string[];
  correct_answer: number;
  marks?: number;
  image_url?: string;
}

export interface Question {
  id: number;
  exam_id?: number;
  text: string;
  options: string[];
  marks: number;
  image_url?: string;
}

export interface AnswerItem {
  question_id: number;
  answer_index: number;
}

export interface ResultSubmit {
  exam_id: number;
  answers: AnswerItem[];
}

export interface Result {
  id: number;
  student_id: number;
  exam_id: number;
  answers: AnswerItem[];
  score: number;
  max_score: number;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface Class {
  id: number;
  name: string;
  level: string;
}

export interface ClassWithSubjects extends Class {
  subjects: Subject[];
  students?: User[];
  teachers?: User[];
}

export interface ClassAssignment {
  student_id?: number;
  teacher_id?: number;
  class_id: number;
  subjects_assigned?: number;
  exams_created?: number;
  message?: string;
}

export interface TeacherSubjectAssignment {
  id?: number;
  teacher_id: number;
  subject_id: number;
  class_id: number;
  teacher_name?: string;
  teacher_email?: string;
  message?: string;
}

export interface SubjectWithTeachers {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  teachers: Array<{
    id: number;
    teacher_id: number;
    teacher_name: string;
    teacher_email: string;
  }>;
}

export interface ClassMember {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

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
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    return response.json();
  },
};

// ============================================
// USERS API
// ============================================

export const usersAPI = {
  create: async (payload: RegisterPayload, token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
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
      const response = await fetch(`${API_BASE_URL}/api/users`, {
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
    updates: { full_name?: string; password?: string; role?: string },
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
};

// ============================================
// EXAMS API
// ============================================

export const examsAPI = {
  create: async (payload: ExamCreate, token: string): Promise<Exam> => {
    const response = await fetch(`${API_BASE_URL}/api/exams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Exam creation failed");
    }

    return response.json();
  },

  list: async (): Promise<Exam[]> => {
    const response = await fetch(`${API_BASE_URL}/api/exams`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch exams");
    }

    return response.json();
  },

  getById: async (examId: number): Promise<Exam> => {
    const response = await fetch(`${API_BASE_URL}/api/exams/${examId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch exam");
    }

    return response.json();
  },

  importFromDocument: async (
    examId: number,
    file: File,
    token: string
  ): Promise<{
    success: boolean;
    questions_imported: number;
    exam_id: number;
  }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_BASE_URL}/api/exams/import-from-document/${examId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Document import failed");
    }

    return response.json();
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

  getForExam: async (examId: number): Promise<Question[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/questions/exam/${examId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch questions");
    }

    return response.json();
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

    if (!response.ok) {
      throw new Error("Failed to fetch school levels");
    }

    return response.json();
  },

  listClasses: async (): Promise<Class[]> => {
    const response = await fetch(`${API_BASE_URL}/api/classes`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch classes");
    }

    return response.json();
  },

  getClass: async (classId: number): Promise<ClassWithSubjects> => {
    const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch class");
    }

    return response.json();
  },

  getClassesByLevel: async (level: string): Promise<Class[]> => {
    const response = await fetch(`${API_BASE_URL}/api/classes/level/${level}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch classes by level");
    }

    return response.json();
  },

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

  assignStudentToClass: async (
    classId: number,
    studentId: number,
    token: string
  ): Promise<ClassAssignment> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/assign-student`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: studentId, class_id: classId }),
      }
    );

    if (!response.ok) {
      // Try to parse JSON error body, but handle non-string details safely
      let errBody: unknown = null;
      try {
        errBody = await response.json();
      } catch {
        const text = await response.text();
        throw new Error(text || "Failed to assign student to class");
      }

      const eb = errBody as Record<string, unknown> | null;
      const detail: unknown = eb?.detail ?? eb?.message ?? errBody;
      const message =
        typeof detail === "string" ? detail : JSON.stringify(detail);
      throw new Error(message || "Failed to assign student to class");
    }

    // Successful response - parse JSON
    return response.json();
  },

  assignTeacherToClass: async (
    classId: number,
    teacherId: number,
    token: string
  ): Promise<ClassAssignment> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/assign-teacher`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teacher_id: teacherId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to assign teacher to class");
    }

    return response.json();
  },

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to remove subject from class");
    }

    return response.json();
  },

  getClassStudents: async (classId: number): Promise<ClassMember[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/students`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch class students");
    }

    return response.json();
  },

  getClassTeachers: async (classId: number): Promise<ClassMember[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/teachers`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch class teachers");
    }

    return response.json();
  },

  listSubjects: async (): Promise<Subject[]> => {
    const response = await fetch(`${API_BASE_URL}/api/classes/subjects`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch subjects");
    }

    return response.json();
  },

  assignTeacherToSubject: async (
    classId: number,
    teacherId: number,
    subjectId: number,
    token: string
  ): Promise<ClassAssignment> => {
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
          class_id: classId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to assign teacher to subject");
    }

    return response.json();
  },

  getClassSubjectsWithTeachers: async (
    classId: number
  ): Promise<SubjectWithTeachers[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/${classId}/subjects-with-teachers`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch subjects with teachers");
    }

    return response.json();
  },

  getSubjectTeachers: async (
    subjectId: number,
    classId: number
  ): Promise<TeacherSubjectAssignment[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/classes/subject/${subjectId}/teachers?class_id=${classId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch subject teachers");
    }

    return response.json();
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
};

export const setStoredAuth = (token: string, user: User): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", token);
  localStorage.setItem("currentUser", JSON.stringify(user));
};

export const clearStoredAuth = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("currentUser");
};
