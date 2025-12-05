// lib/types.ts

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
  passport?: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  student_class?: string;
  registration_number?: string;
  passport?: string;
}

export interface ClassCreatePayload {
  name: string;
  level: string;
  subjectIds: number[];
}

export interface ClassUpdatePayload {
  name: string;
  level: string;
  subjectIds: number[];
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
  text: string;
  options: string[];
  correct_answer: number; // <--- add this
  marks: number;
  image_url?: string | null;
  created_by?: number;
  exam_id?: number;
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

export interface SchoolLevel {
  code: string;
  display_name: string;
}
