import { openDB, IDBPDatabase } from "idb";

//////////////////////
// TYPES
//////////////////////

export interface User {
  name: string;
  email: string;
  password: string;
  role: "admin" | "teacher" | "student";
}

export interface Student {
  regNumber: string; // NG/GRA/1234A
  name: string;
  email: string;
  class: string;
}

export interface Question {
  id?: number;
  question: string;
  options: string[];
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correctAnswer?: string;
}

export interface Exam {
  id?: number;
  title: string;
  questions: Question[];
  duration?: number; // in minutes
}

export interface Result {
  id?: number;
  examId: number;
  studentEmail: string;
  answers: string[];
  score?: number;
  max?: number;
  duration?: number;
  startedAt?: number;
  finishedAt?: number;
}

//////////////////////
// DATABASE SCHEMA
//////////////////////

interface SchoolCBTDB {
  users: User;
  students: Student;
  exams: Exam;
  results: Result;
}

//////////////////////
// INITIALIZE DB
//////////////////////

export const initDB = async (): Promise<IDBPDatabase<SchoolCBTDB>> => {
  return await openDB<SchoolCBTDB>("school-cbt-db", 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("users")) {
        const store = db.createObjectStore("users", { keyPath: "email" });
        store.createIndex("email", "email", { unique: true });
      }

      if (!db.objectStoreNames.contains("students")) {
        const store = db.createObjectStore("students", { keyPath: "regNumber" });
        store.createIndex("class", "class");
        store.createIndex("email", "email", { unique: true });
      }

      if (!db.objectStoreNames.contains("exams")) {
        const store = db.createObjectStore("exams", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("title", "title");
      }

      if (!db.objectStoreNames.contains("results")) {
        const store = db.createObjectStore("results", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("examId", "examId");
        store.createIndex("studentEmail", "studentEmail");
      }
    },
  });
};

//////////////////////
// UTILS
//////////////////////

export const generateRegNumber = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
  return `NG/GRA/${num}${letter}`;
};

//////////////////////
// USER FUNCTIONS
//////////////////////

export const addUser = async (user: User): Promise<boolean> => {
  const db = await initDB();
  try {
    await db.add("users", user);
    return true;
  } catch {
    return false;
  }
};

export const getUser = async (
  email: string,
  password: string
): Promise<User | null> => {
  const db = await initDB();
  const user = await db.get("users", email);
  if (user && user.password === password) return user;
  return null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const db = await initDB();
  return await db.getAll("users");
};

//////////////////////
// STUDENT FUNCTIONS
//////////////////////

export const addStudent = async (student: Omit<Student, "regNumber">): Promise<Student> => {
  const db = await initDB();
  const regNumber = generateRegNumber();
  const studentWithReg: Student = { ...student, regNumber };
  await db.add("students", studentWithReg);
  return studentWithReg;
};

export const getAllStudents = async (): Promise<Student[]> => {
  const db = await initDB();
  return await db.getAll("students");
};

export const getStudentsByClass = async (className: string): Promise<Student[]> => {
  const db = await initDB();
  const tx = db.transaction("students", "readonly");
  const index = tx.objectStore("students").index("class");
  return await index.getAll(className);
};

export const getStudentByRegNumber = async (regNumber: string): Promise<Student | undefined> => {
  const db = await initDB();
  return await db.get("students", regNumber);
};

//////////////////////
// EXAM FUNCTIONS
//////////////////////

export const addExam = async (exam: Exam): Promise<number> => {
  const db = await initDB();
  const id = await db.add("exams", exam);
  return id as number;
};

export const getAllExams = async (): Promise<Exam[]> => {
  const db = await initDB();
  return await db.getAll("exams");
};

export const getExamById = async (id: number): Promise<Exam | undefined> => {
  const db = await initDB();
  return await db.get("exams", id);
};

export const updateExam = async (
  id: number,
  data: Partial<Exam>
): Promise<boolean> => {
  const db = await initDB();
  const exam = await db.get("exams", id);
  if (!exam) return false;
  await db.put("exams", { ...exam, ...data });
  return true;
};

export const deleteExam = async (id: number): Promise<void> => {
  const db = await initDB();
  await db.delete("exams", id);
};

//////////////////////
// RESULTS FUNCTIONS
//////////////////////

export const addResult = async (result: Result): Promise<number> => {
  const db = await initDB();
  const id = await db.add("results", result);
  return id as number;
};

export const getResultsByExam = async (examId: number): Promise<Result[]> => {
  const db = await initDB();
  const index = db.transaction("results").objectStore("results").index("examId");
  return await index.getAll(examId);
};

export const getResultsByStudent = async (studentEmail: string): Promise<Result[]> => {
  const db = await initDB();
  const index = db.transaction("results").objectStore("results").index("studentEmail");
  return await index.getAll(studentEmail);
};
