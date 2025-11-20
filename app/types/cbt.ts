// app/types/cbt.ts
interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer?: string | number;
}

export interface Exam {
  id: number;
  title: string;
  duration: number;
  questions: MCQQuestion[];
}

export interface Result {
  id?: number; // optional to match DB
  examId: number;
  studentEmail: string;
  answers: string[];
  score: number;
  max: number;
  duration: number;
  startedAt?: number; // optional
  finishedAt: number;
}

export interface User {
  name?: string;
  email: string;
  role?: string;
}

export interface Student {
  id?: number;
  name: string;
  email: string;
  className: string;
  regNumber: string;
  passport?: string; // base64 or URL
}
