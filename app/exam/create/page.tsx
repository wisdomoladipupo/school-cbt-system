"use client";

import { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import {  getStoredToken,  } from "@/lib/api";
import { questionsAPI, classesAPI, examsAPI } from "@/lib/api/api";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number | null;
  imageUrl?: string;
}

export default function CreateExamBuilder() {
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", "", ""], correctAnswer: null },
  ]);
  const [uploadingImage, setUploadingImage] = useState<Record<number, boolean>>(
    {}
  );
  const token = getStoredToken();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<number>(30);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const c = await classesAPI.listClasses();
        setClasses(c);
      } catch (err) {
        console.error("Failed to load classes:", err);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!selectedClass) {
        setClassSubjects([]);
        return;
      }
      try {
        const info = await classesAPI.getClass(selectedClass);
        setClassSubjects(info.subjects || []);
      } catch (err) {
        console.error("Failed to load class subjects:", err);
        setClassSubjects([]);
      }
    };
    loadSubjects();
  }, [selectedClass]);

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

  async function handleImageUpload(index: number, file: File) {
    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      setUploadingImage({ ...uploadingImage, [index]: true });
      const result = await questionsAPI.uploadImage(file, token);

      const updated = [...questions];
      updated[index].imageUrl = result.image_url;
      setQuestions(updated);
    } catch (error) {
      alert(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setUploadingImage({ ...uploadingImage, [index]: false });
    }
  }

  function removeImage(index: number) {
    const updated = [...questions];
    updated[index].imageUrl = undefined;
    setQuestions(updated);
  }

  async function submitExam() {
    if (!title.trim()) {
      alert("Please provide an exam title");
      return;
    }
    if (!selectedClass) {
      alert("Please select a class for this exam");
      return;
    }
    if (!selectedSubject) {
      alert("Please select a subject for this exam");
      return;
    }

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

    if (!token) {
      alert("Please login to save the exam");
      return;
    }

    setSaving(true);
    try {
      // create exam
      const examPayload = {
        title,
        description,
        duration_minutes: duration,
        published: false,
        class_id: selectedClass,
        subject_id: selectedSubject,
      };

      const createdExam = await examsAPI.create(examPayload as any, token);

      // create questions
      for (const q of questions) {
        const payload = {
          exam_id: createdExam.id,
          text: q.question,
          options: q.options,
          correct_answer: q.correctAnswer as number,
          marks: 1,
          image_url: q.imageUrl,
        };
        try {
          await questionsAPI.create(payload as any, token);
        } catch (err) {
          console.error("Failed to create question:", err);
        }
      }

      alert("Exam and questions saved successfully");
      // reset form
      setTitle("");
      setDescription("");
      setDuration(30);
      setQuestions([
        { question: "", options: ["", "", "", ""], correctAnswer: null },
      ]);
      setSelectedClass(null);
      setSelectedSubject(null);
    } catch (err) {
      console.error("Failed to save exam:", err);
      alert(err instanceof Error ? err.message : "Failed to save exam");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900">Exam Builder</h1>

      {/* Exam metadata: title, description, duration, class, subject */}
      <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            placeholder="Exam Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded text-black"
          />
          <textarea
            placeholder="Brief description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded text-black"
            rows={2}
          />
          <div className="flex gap-3">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value || "30"))}
              className="w-32 p-2 border rounded text-black"
            />
            <select
              value={selectedClass ?? ""}
              onChange={(e) =>
                setSelectedClass(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="flex-1 p-2 border rounded text-black"
            >
              <option value="">-- Select Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.level})
                </option>
              ))}
            </select>
            <select
              value={selectedSubject ?? ""}
              onChange={(e) =>
                setSelectedSubject(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="flex-1 p-2 border rounded text-black"
              disabled={!classSubjects.length}
            >
              <option value="">-- Select Subject --</option>
              {classSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

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

          {/* IMAGE UPLOAD */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            {q.imageUrl ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Question Image:
                </p>
                <img
                  src={`http://localhost:8000${q.imageUrl}`}
                  alt="Question"
                  className="max-h-40 rounded"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(index, e.target.files[0]);
                    }
                  }}
                  disabled={uploadingImage[index]}
                  className="hidden"
                />
                <div className="text-center py-2">
                  <p className="text-gray-600">
                    {uploadingImage[index]
                      ? "Uploading..."
                      : "Click to upload an image for this question"}
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* OPTIONS */}
          <div className="space-y-3">
            <h3 className="font-semibold text-black">Options</h3>
            {q.options.map((opt, optIndex) => (
              <div
                key={optIndex}
                className="flex text-black items-center gap-3"
              >
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
