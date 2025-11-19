import { openDB } from "idb";

// Initialize IndexedDB
export const initDB = async () => {
  return await openDB("school-cbt-db", 1, {
    upgrade(db) {
      // Users store
      if (!db.objectStoreNames.contains("users")) {
        const store = db.createObjectStore("users", { keyPath: "email" });
        store.createIndex("email", "email", { unique: true });
      }

      // Exams store
      if (!db.objectStoreNames.contains("exams")) {
        const store = db.createObjectStore("exams", { keyPath: "id", autoIncrement: true });
        store.createIndex("title", "title");
      }

      // Optional: Results store for storing student answers
      if (!db.objectStoreNames.contains("results")) {
        const store = db.createObjectStore("results", { keyPath: "id", autoIncrement: true });
        store.createIndex("examId", "examId");
        store.createIndex("studentEmail", "studentEmail");
      }
    },
  });
};

//////////////////////
// USER FUNCTIONS
//////////////////////

export const addUser = async (user: { name: string; email: string; password: string; role: string }) => {
  const db = await initDB();
  try {
    await db.add("users", user);
    return true;
  } catch (err) {
    return false; // User already exists
  }
};

// Get user by email + password (for login)
export const getUser = async (email: string, password: string) => {
  const db = await initDB();
  const tx = db.transaction("users", "readonly");
  const store = tx.objectStore("users");
  const user = await store.get(email);
  if (user && user.password === password) return user;
  return null;
};

// Get all users
export const getAllUsers = async () => {
  const db = await initDB();
  return await db.getAll("users");
};

//////////////////////
// EXAM FUNCTIONS
//////////////////////

export const addExam = async (exam: { title: string; questions: string[] }) => {
  const db = await initDB();
  return await db.add("exams", exam);
};

export const getAllExams = async () => {
  const db = await initDB();
  return await db.getAll("exams");
};

export const getExamById = async (id: number) => {
  const db = await initDB();
  return await db.get("exams", id);
};

export const updateExam = async (id: number, data: any) => {
  const db = await initDB();
  const exam = await db.get("exams", id);
  if (!exam) return false;
  const updated = { ...exam, ...data };
  await db.put("exams", updated);
  return true;
};

export const deleteExam = async (id: number) => {
  const db = await initDB();
  return await db.delete("exams", id);
};

//////////////////////
// RESULTS FUNCTIONS
//////////////////////

export const addResult = async (result: { examId: number; studentEmail: string; answers: string[] }) => {
  const db = await initDB();
  return await db.add("results", result);
};

export const getResultsByExam = async (examId: number) => {
  const db = await initDB();
  const tx = db.transaction("results", "readonly");
  const store = tx.objectStore("results");
  const index = store.index("examId");
  return await index.getAll(examId);
};

export const getResultsByStudent = async (studentEmail: string) => {
  const db = await initDB();
  const tx = db.transaction("results", "readonly");
  const store = tx.objectStore("results");
  const index = store.index("studentEmail");
  return await index.getAll(studentEmail);
};
