"use client";

import { useState, useEffect, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { getStoredToken } from "@/lib/api";
import { questionsAPI, classesAPI, examsAPI } from "@/lib/api/api";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number | null;
  imageUrl?: string;
}

export default function CreateExamBuilder() {
  const token = getStoredToken();

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", "", ""], correctAnswer: null },
  ]);
  const [uploadingImage, setUploadingImage] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [importingFile, setImportingFile] = useState(false);
  const [createdExamId, setCreatedExamId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const c = await classesAPI.listClasses();
        setClasses(c);
      } catch (err) {
        console.error("Failed to load classes:", err);
      }
    };
    fetchClasses();
  }, []);

  // Load subjects for selected class
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

  // -------------------- Question Handlers --------------------
  const addQuestion = () =>
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correctAnswer: null }]);

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index: number, value: string) => {
    const updated = [...questions];
    updated[index].question = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const setCorrect = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = optIndex;
    setQuestions(updated);
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!token) return alert("Please login first");
    try {
      setUploadingImage({ ...uploadingImage, [index]: true });
      const result = await questionsAPI.uploadImage(file, token);
      const updated = [...questions];
      updated[index].imageUrl = result.image_url;
      setQuestions(updated);
    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setUploadingImage({ ...uploadingImage, [index]: false });
    }
  };

  const removeImage = (index: number) => {
    const updated = [...questions];
    updated[index].imageUrl = undefined;
    setQuestions(updated);
  };

  // -------------------- Exam Submission --------------------
  const submitExam = async () => {
    if (!title.trim()) return alert("Please provide an exam title");
    if (!selectedClass) return alert("Please select a class");
    if (!selectedSubject) return alert("Please select a subject");

    // Validate only non-empty questions
    const nonEmptyQuestions = questions.filter(q => q.question.trim());
    for (const q of nonEmptyQuestions) {
      if (q.correctAnswer === null)
        return alert("All questions must have a correct answer selected!");
    }
    if (!token) return alert("Please login to save the exam");

    setSaving(true);
    try {
      // Create exam
      const examPayload = {
        title,
        description: "",
        duration_minutes: duration,
        published: false,
        class_id: selectedClass,
        subject_id: selectedSubject,
      };
      const createdExam = await examsAPI.create(examPayload as any, token);
      setCreatedExamId(createdExam.id);

      // Create questions (only non-empty ones)
      for (const q of nonEmptyQuestions) {
        await questionsAPI.create(
          {
            exam_id: createdExam.id,
            text: q.question,
            options: q.options,
            correct_answer: q.correctAnswer as number,
            marks: 1,
            image_url: q.imageUrl,
          } as any,
          token
        );
      }

      alert("Exam and questions saved successfully");
      resetForm();
    } catch (err) {
      console.error("Failed to save exam:", err);
      alert(err instanceof Error ? err.message : "Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDuration(30);
    setQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: null }]);
    setSelectedClass(null);
    setSelectedSubject(null);
    setCreatedExamId(null);
  };

  // -------------------- Import Document --------------------
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportDocument = async (file: File) => {
    if (!token) return alert("Please login first");

    try {
      setImportingFile(true);

      let examId = createdExamId;

      // Auto-create exam if not yet created
      if (!examId) {
        if (!title.trim()) return alert("Please provide an exam title");
        if (!selectedClass) return alert("Please select a class");
        if (!selectedSubject) return alert("Please select a subject");

        const examPayload = {
          title,
          description,
          duration_minutes: duration,
          published: false,
          class_id: selectedClass,
          subject_id: selectedSubject,
        };

        const createdExam = await examsAPI.create(examPayload as any, token);
        examId = createdExam.id;
        setCreatedExamId(examId);
      }

      // Import questions from Word document
      const result = await examsAPI.importFromDocument(examId, file, token);
      alert(`Imported ${result.questions_imported} questions successfully!`);

      // Refresh questions in builder
      const updatedQuestions = await questionsAPI.getForExam(examId, token);
      const mapped = updatedQuestions.map((q: any) => ({
        question: q.text,
        options: q.options,
        correctAnswer: q.correct_answer,
        imageUrl: q.image_url,
      }));
      setQuestions(mapped);
    } catch (err) {
      console.error("Import failed:", err);
      alert(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImportingFile(false);
    }
  };

  // -------------------- JSX --------------------
  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900">Exam Builder</h1>

      {/* Exam Metadata */}
      <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            placeholder="Exam Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded text-black"
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
                setSelectedClass(e.target.value ? parseInt(e.target.value) : null)
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
                setSelectedSubject(e.target.value ? parseInt(e.target.value) : null)
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

      {/* Import Document */}
      <label
        className="cursor-pointer bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        onClick={handleImportClick}
      >
        {importingFile ? "Importing..." : "Import Exam Document"}
        <input
          type="file"
          ref={fileInputRef}
          accept=".doc,.docx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImportDocument(e.target.files[0])}
        />
      </label>

      {/* Questions */}
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

          {/* Question Editor */}
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

          {/* Options */}
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
                  onChange={(e) => updateOption(index, optIndex, e.target.value)}
                  placeholder={`Option ${optIndex + 1}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
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
