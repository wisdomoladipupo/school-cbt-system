"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "../dashboard/layout";
import { getResultsByStudent, getAllExams } from "../../lib/db";

import type { Exam, Result, User } from "../types/cbt";

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [examsMap, setExamsMap] = useState<Record<number, Exam>>({});

 useEffect(() => {
  const load = async () => {
    let currentUser: User | null = null;

    try {
      const raw = localStorage.getItem("currentUser");
      currentUser = raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Error parsing currentUser from localStorage", e);
    }

    if (!currentUser?.email) return;

    // Fetch student results from DB
    const dbResults = await getResultsByStudent(currentUser.email);

    // Map DB results to frontend Result type safely
    const mappedResults: Result[] = (dbResults || []).map(r => ({
      id: r.id ?? 0,
      examId: r.examId ?? 0,
      studentEmail: r.studentEmail ?? "",
      answers: r.answers ?? [],
      score: r.score ?? 0,
      max: r.max ?? 0,
      duration: r.duration ?? 0,
      startedAt: r.startedAt ?? undefined, // optional in frontend type
      finishedAt: r.finishedAt ?? Date.now(),
    }));

    setResults(mappedResults);

    // Fetch all exams from DB
    const allExams = await getAllExams();

    // Map exams safely by ID
    const map: Record<number, Exam> = {};
    allExams.forEach(e => {
      if (e.id != null) {
        map[e.id] = {
          id: e.id,
          title: e.title ?? "Untitled Exam",
          duration: e.duration ?? 30, // default duration 30 mins
          questions: e.questions ?? [], // ensure array exists
        };
      }
    });

    setExamsMap(map);
  };

  load();
}, []);


  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-white min-h-screen">
        <h1 className="text-2xl font-semibold">My Results</h1>

        {results.length === 0 ? (
          <p>No results yet.</p>
        ) : (
          <ul className="space-y-4">
            {results.map((res) => {
              // Skip results for exams that don’t exist
              const exam = examsMap[res.examId];
              return (
                <li key={res.id} className="p-4 border rounded bg-white shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{exam?.title || `Exam ${res.examId}`}</div>
                      <div className="text-sm text-gray-600">
                        Submitted: {new Date(res.finishedAt ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{res.score ?? 0} / {res.max ?? 0}</div>
                      <div className="text-sm text-gray-600">Duration: {res.duration ?? 0}s</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
