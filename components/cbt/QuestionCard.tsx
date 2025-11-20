"use client";

import React from "react";

// Question can be:
// 1. A simple HTML string
// 2. A structured MCQ question with options
export interface MCQQuestion {
  question: string;      // HTML string
  options: string[];
}

export type QuestionType = string | MCQQuestion;

interface QuestionCardProps {
  question: QuestionType;
  index: number;
  total: number;
  selected: string | number | null;   // text or option index
  onAnswer: (value: string | number) => void;
}

export default function QuestionCard({
  question,
  index,
  total,
  selected,
  onAnswer,
}: QuestionCardProps) {

  const isMCQ =
    typeof question === "object" &&
    question !== null &&
    "options" in question;

  const htmlContent = isMCQ ? question.question : (question as string);

  return (
    <div className="bg-white p-6 rounded shadow-sm">
      <div className="mb-4">
        <div
          dangerouslySetInnerHTML={{
            __html: `<div>${htmlContent || ""}</div>`,
          }}
        />
      </div>

      {isMCQ ? (
        <div className="space-y-3">
          {question.options.map((opt: string, i: number) => (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              className={`w-full text-left p-3 rounded border ${
                selected === i ? "bg-blue-600 text-white" : ""
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <label className="block mb-2 font-medium">Your Answer</label>
          <input
            type="text"
            value={(selected as string) || ""}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
      )}
    </div>
  );
}
