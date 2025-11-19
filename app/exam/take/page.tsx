"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "../../dashboard/layout";
import { getExamById } from "../../../lib/db";

export default function TakeExamPage() {
  const params = useParams();
  const examId = Number(params.examId);
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    const loadExam = async () => {
      const e = await getExamById(examId);
      setExam(e);
      setAnswers(e.questions.map(() => ""));
    };
    loadExam();
  }, [examId]);

  const handleAnswerChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubmit = () => {
    alert(`Exam submitted!\nAnswers: ${JSON.stringify(answers)}`);
  };

  if (!exam) return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-4">{exam.title}</h2>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {exam.questions.map((q: string, i: number) => (
          <div key={i}>
            <p className="mb-1 font-semibold">{i + 1}. {q}</p>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={answers[i]}
              onChange={(e) => handleAnswerChange(i, e.target.value)}
              required
            />
          </div>
        ))}

        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Submit Exam
        </button>
      </form>
    </DashboardLayout>
  );
}
