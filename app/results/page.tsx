"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "../dashboard/layout";
import { resultsAPI, examsAPI, getStoredToken } from "../../lib/api";

import type { Exam, Result } from "../types/cbt";

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [examsMap, setExamsMap] = useState<Record<number, Exam>>({});

 useEffect(() => {
  const load = async () => {
    try {
      const token = getStoredToken();
      if (!token) return;

      // Fetch student results from API
      const studentResults = await resultsAPI.getMyResults(token);

      // Map API results to frontend Result type
      const mappedResults: Result[] = studentResults.map((r) => ({
        id: r.id,
        examId: r.exam_id,
        studentEmail: "",
        answers: r.answers as unknown as string[],
        score: r.score,
        max: r.max_score,
        duration: 0,
        finishedAt: Date.now(),
      }));

      setResults(mappedResults);

      // Fetch all exams from API
      const allExams = await examsAPI.list();

      // Map exams safely by ID
      const map: Record<number, Exam> = {};
      allExams.forEach((e) => {
        map[e.id] = {
          id: e.id,
          title: e.title,
          duration: e.duration_minutes,
          questions: [],
        };
      });

      setExamsMap(map);
    } catch (error) {
      console.error("Failed to load results:", error);
    }
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
