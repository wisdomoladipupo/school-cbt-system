"use client";

import { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number | null;
}

export default function CreateExamBuilder() {
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", "", ""], correctAnswer: null },
  ]);

  function addQuestion() {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], correctAnswer: null },
    ]);
  }

  function removeQuestion(index: number) {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestionText(index: number, value: string) {
    const updated = [...questions];
    updated[index].question = value;
    setQuestions(updated);
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  }

  function setCorrect(qIndex: number, optIndex: number) {
    const updated = [...questions];
    updated[qIndex].correctAnswer = optIndex;
    setQuestions(updated);
  }

  function submitExam() {
    for (const q of questions) {
      if (!q.question.trim()) {
        alert("A question is empty!");
        return;
      }
      if (q.correctAnswer === null) {
        alert("Some questions have no correct answer selected!");
        return;
      }
    }
    console.log("FINAL EXAM PAYLOAD:", questions);
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900">Exam Builder</h1>

      {questions.map((q, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-md p-6 space-y-6 border border-gray-200"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Question {index + 1}
            </h2>
            {questions.length > 1 && (
              <button
                onClick={() => removeQuestion(index)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Remove
              </button>
            )}
          </div>

          {/* QUESTION EDITOR */}
          <Editor
            apiKey={"a577i0klhoyk4olpmachbpkazs6i4hl994d4wfv9ej4udnyj"}
            init={{
              height: 250,
              menubar: false,
              plugins: "lists link image table code",
              toolbar:
                "undo redo | bold italic | alignleft aligncenter alignright | bullist numlist | code",
              content_style:
                "body { font-family: Inter, sans-serif; font-size: 14px; color: #111827; }",
            }}
            value={q.question}
            onEditorChange={(content) => updateQuestionText(index, content)}
          />

          {/* OPTIONS */}
          <div className="space-y-3">
            <h3 className="font-semibold text-black">Options</h3>
            {q.options.map((opt, optIndex) => (
              <div key={optIndex} className="flex text-black items-center gap-3">
                <input
                  type="radio"
                  name={`correct-${index}`}
                  checked={q.correctAnswer === optIndex}
                  onChange={() => setCorrect(index, optIndex)}
                  className="accent-indigo-600 w-4 h-4"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) =>
                    updateOption(index, optIndex, e.target.value)
                  }
                  placeholder={`Option ${optIndex + 1}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-4">
        <button
          onClick={addQuestion}
          className="px-5 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          + Add Another Question
        </button>

        <button
          onClick={submitExam}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Save Exam
        </button>
      </div>
    </div>
  );
}
