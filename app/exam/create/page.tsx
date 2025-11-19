"use client";

import { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import DashboardLayout from "../../dashboard/layout";
import { addExam } from "../../../lib/db";

export default function CreateExamPage() {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [message, setMessage] = useState("");

  const handleAddQuestion = () => setQuestions([...questions, ""]);

  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || questions.some((q) => !q)) {
      setMessage("Please fill in all fields");
      return;
    }

    await addExam({ title, questions });
    setMessage("Exam created successfully!");
    setTitle("");
    setQuestions([""]);
  };

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-4">Create Exam</h2>
      {message && <p className="text-green-500 mb-4">{message}</p>}

      <form onSubmit={handleCreateExam} className="space-y-6">
        <div>
          <label className="block mb-2 font-semibold">Exam Title</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {questions.map((q, i) => (
          <div key={i} className="mb-4">
            <label className="block mb-2 font-semibold">Question {i + 1}</label>
            <Editor
              apiKey="a577i0klhoyk4olpmachbpkazs6i4hl994d4wfv9ej4udnyj" // Optional: leave empty for free offline
              value={q}
              init={{
                height: 200,
                menubar: false,
                plugins: ["lists link image paste help wordcount"],
                toolbar:
                  "undo redo | bold italic underline | bullist numlist | alignleft aligncenter alignright | link | help",
                branding: false,
              }}
              onEditorChange={(content) => handleQuestionChange(i, content)}
            />
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Add Question
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Create Exam
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
