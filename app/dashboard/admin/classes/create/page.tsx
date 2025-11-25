"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { classesAPI, getStoredToken, type SchoolLevel } from "@/lib/api";

// School subjects mapping for display
const SCHOOL_SUBJECTS: Record<string, string[]> = {
  NUR1: ["Numeracy", "Literacy", "Creative Activities", "Play/Breaks"],
  NUR2: ["Numeracy", "Literacy", "Creative Activities", "Play/Breaks"],
  NUR3: ["Numeracy", "Literacy", "Creative Activities", "Play/Breaks"],
  PRY1: [
    "English Language",
    "Mathematics",
    "Science",
    "Social Studies",
    "Physical Education",
    "Music",
    "Art and Craft",
  ],
  PRY2: [
    "English Language",
    "Mathematics",
    "Science",
    "Social Studies",
    "Physical Education",
    "Music",
    "Art and Craft",
  ],
  PRY3: [
    "English Language",
    "Mathematics",
    "Science",
    "Social Studies",
    "Physical Education",
    "Music",
    "Art and Craft",
  ],
  PRY4: [
    "English Language",
    "Mathematics",
    "Science",
    "Social Studies",
    "Physical Education",
    "Music",
    "Art and Craft",
  ],
  PRY5: [
    "English Language",
    "Mathematics",
    "Science",
    "Social Studies",
    "Physical Education",
    "Music",
    "Art and Craft",
  ],
  PRY6: [
    "English Language",
    "Mathematics",
    "Science",
    "Social Studies",
    "Physical Education",
    "Music",
    "Art and Craft",
  ],
  JSS1: [
    "English Language",
    "Mathematics",
    "Integrated Science",
    "Social Studies",
    "Civic Education",
    "Computer Science",
    "Physical Education",
    "Music",
    "Visual Arts",
  ],
  JSS2: [
    "English Language",
    "Mathematics",
    "Integrated Science",
    "Social Studies",
    "Civic Education",
    "Computer Science",
    "Physical Education",
    "Music",
    "Visual Arts",
  ],
  JSS3: [
    "English Language",
    "Mathematics",
    "Integrated Science",
    "Social Studies",
    "Civic Education",
    "Computer Science",
    "Physical Education",
    "Music",
    "Visual Arts",
  ],
  SS1: [
    "English Language",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Government",
    "Economics",
    "Literature in English",
    "Computer Science",
    "Physical Education",
    "Technical Drawing",
  ],
  SS2: [
    "English Language",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Government",
    "Economics",
    "Literature in English",
    "Computer Science",
    "Physical Education",
    "Technical Drawing",
  ],
  SS3: [
    "English Language",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Government",
    "Economics",
    "Literature in English",
    "Computer Science",
    "Physical Education",
    "Technical Drawing",
  ],
};

export default function CreateClassPage() {
  const router = useRouter();
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = getStoredToken();
  const derivedClassName =
    schoolLevels.find((l) => l.code === selectedLevel)?.display_name ||
    selectedLevel;

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const levels = await classesAPI.getSchoolLevels();
        setSchoolLevels(levels);
        if (levels.length > 0) {
          setSelectedLevel(levels[0].code);
        }
      } catch (err) {
        setError(
          `Failed to load school levels: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoadingLevels(false);
      }
    };

    fetchLevels();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!selectedLevel) {
      setError("Please select a school level");
      return;
    }

    if (!token) {
      setError("You are not authenticated. Please login.");
      return;
    }

    setLoading(true);
    try {
      const nameToCreate = derivedClassName || selectedLevel;
      await classesAPI.createClass(
        {
          name: nameToCreate,
          level: selectedLevel,
        },
        token
      );

      setMessage(
        `✓ Class "${nameToCreate}" created successfully! You can create another class or go to class management.`
      );
      setSelectedLevel(schoolLevels[0]?.code || "");
    } catch (err) {
      setError(
        `Failed to create class: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingLevels) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600">
        <div className="text-white text-xl">Loading school levels...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Create New Class
        </h1>

        {message && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg border border-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateClass} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              School Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
            >
              <option value="">-- Select a level --</option>
              {schoolLevels.map((level) => (
                <option key={level.code} value={level.code}>
                  {level.display_name} ({level.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Subjects will be automatically assigned based on the selected
              level
            </p>
          </div>

          {/* Display subjects for selected level */}
          {selectedLevel && SCHOOL_SUBJECTS[selectedLevel] && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Subjects for this class:
              </p>
              <div className="flex flex-wrap gap-2">
                {SCHOOL_SUBJECTS[selectedLevel].map((subject, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-700 mb-2">Class Name</p>
            <div className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700">
              {derivedClassName || "(select a level to see class name)"}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Class name is auto-generated from the selected level
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "Creating..." : "Create Class"}
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/admin")}
              className="flex-1 py-2 text-gray-600 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition"
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2 text-gray-600 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition"
            >
              Back
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            Available Levels:
          </h3>
          <div className="text-sm text-blue-800">
            <p>• Nursery: NUR1, NUR2, NUR3</p>
            <p>• Primary: PRY1 - PRY6</p>
            <p>• JSS: JSS1, JSS2, JSS3</p>
            <p>• SS: SS1, SS2, SS3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
