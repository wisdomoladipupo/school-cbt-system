"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getStoredToken,
} from "@/lib/api/token";
import { classesAPI } from "@/lib/api/api";
import type { SchoolLevel, Subject } from "@/lib/api";
export default function CreateClassPage() {
  const router = useRouter();
  const token = getStoredToken();

  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [derivedClassName, setDerivedClassName] = useState("");
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");

  // Fetch school levels
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const levels = await classesAPI.getSchoolLevels();
        setSchoolLevels(levels);
        if (levels.length > 0) setSelectedLevel(levels[0].code);
      } catch (err) {
        setError(
          `Failed to load school levels: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      } finally {
        setLoadingLevels(false);
      }
    };
    fetchLevels();
  }, []);

  // Update derived class name when selected level changes
  useEffect(() => {
    const name =
      schoolLevels.find((l) => l.code === selectedLevel)?.display_name || selectedLevel;
    setDerivedClassName(name);
  }, [selectedLevel, schoolLevels]);

  // Fetch all subjects globally
  useEffect(() => {
    const fetchAllSubjects = async () => {
      try {
        const subjectsList = await classesAPI.listSubjects();
        setAllSubjects(subjectsList);
      } catch (err) {
        console.error("Failed to load subjects", err);
      }
    };
    fetchAllSubjects();
  }, []);

  // Fetch existing class subjects if class exists
  useEffect(() => {
    const fetchClassSubjects = async () => {
      try {
        // First, get all classes for this level
        const classes = await classesAPI.getClassesByLevel(selectedLevel);
        const existingClass = classes.find(c => c.name === derivedClassName);

        if (existingClass) {
          const classWithSubjects = await classesAPI.getClass(existingClass.id);
          setSubjects(classWithSubjects.subjects.map(s => s.name));
        } else {
          setSubjects([]);
        }
      } catch (err) {
        console.error("Failed to load class subjects", err);
      }
    };

    if (selectedLevel && derivedClassName) fetchClassSubjects();
  }, [selectedLevel, derivedClassName]);

  const addCustomSubject = () => {
    if (!newSubject.trim()) return;
    if (!subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const removeSubject = (subj: string) => {
    setSubjects(subjects.filter((s) => s !== subj));
  };

  const handleCreateOrUpdateClass = async (e: React.FormEvent) => {
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
      // First, check if class already exists
      const classes = await classesAPI.getClassesByLevel(selectedLevel);
      const existingClass = classes.find(c => c.name === derivedClassName);

      let classId: number;

      if (existingClass) {
        // Update existing class
        await classesAPI.updateClassSubjects(
          existingClass.id,
          allSubjects.filter(s => subjects.includes(s.name)).map(s => s.id),
          token
        );
        classId = existingClass.id;
      } else {
        // Create new class
        const newClass = await classesAPI.createClass(
          { name: derivedClassName, level: selectedLevel },
          token
        );
        classId = newClass.id;

        // Update subjects for the new class
        const subjectIds = allSubjects.filter(s => subjects.includes(s.name)).map(s => s.id);
        if (subjectIds.length > 0) {
          await classesAPI.updateClassSubjects(classId, subjectIds, token);
        }
      }

      setMessage(`✓ Class "${derivedClassName}" saved successfully with subjects!`);
      setSubjects([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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
          Create / Update Class
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

        <form onSubmit={handleCreateOrUpdateClass} className="space-y-4">
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
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-2">Class Name</p>
            <div className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700">
              {derivedClassName || "(select a level to see class name)"}
            </div>
          </div>

          {/* Subjects Management */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Subjects for this class:
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {subjects.map((subject, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1"
                >
                  {subject}
                  <button
                    type="button"
                    onClick={() => removeSubject(subject)}
                    className="text-red-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Add custom subject"
                className="flex-1 p-2 border rounded"
              />
              <button
                type="button"
                onClick={addCustomSubject}
                className="bg-green-600 text-white px-3 rounded"
              >
                Add
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "Saving..." : "Save Class"}
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
      </div>
    </div>
  );
}
