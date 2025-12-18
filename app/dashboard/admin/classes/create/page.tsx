"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/lib/api/token";
import { classesAPI } from "@/lib/api/api";
import type { SchoolLevel, Subject } from "@/lib/api";

// UI Components
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// Component Props Types
interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

// Fallback for missing components
const Label = ({ htmlFor, children, className = "" }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 ${className}`}
  >
    {children}
  </label>
);

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

// Custom select implementation
const Select = ({
  value,
  onValueChange,
  children,
  className = "",
}: SelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  // Find the selected option's display text
  const selectedOption = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.props.value === value
  );

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 border border-gray-300 rounded-md bg-white text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedOption && React.isValidElement(selectedOption)
            ? selectedOption.props.children
            : "Select a level..."}
        </span>
        <svg
          className={`w-5 h-5 ml-2 text-gray-500 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto py-1"
          role="listbox"
          aria-label="School levels"
        >
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return null;

            const isSelected = child.props.value === value;
            return (
              <div
                key={child.props.value}
                onClick={() => handleSelect(child.props.value)}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                  isSelected ? "bg-blue-50 text-blue-700" : "text-gray-900"
                }`}
                role="option"
                aria-selected={isSelected}
              >
                {child.props.children}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

// Stub components to maintain compatibility with the existing code
const SelectTrigger = ({
  children,
  className = "",
  ...props
}: SelectTriggerProps) => (
  <div className={className} {...props}>
    {children}
  </div>
);

interface SelectValueProps {
  children: React.ReactNode;
  [key: string]: any;
}

const SelectValue = ({ children, ...props }: SelectValueProps) => (
  <span {...props} className="block truncate">
    {children}
  </span>
);

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const SelectContent = ({
  children,
  className = "",
  ...props
}: SelectContentProps) => (
  <div className={className} {...props}>
    {children}
  </div>
);

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  [key: string]: any;
}

const SelectItem = ({
  children,
  value,
  className = "",
  ...props
}: SelectItemProps) => (
  <div className={className} data-value={value} {...props}>
    {children}
  </div>
);

// Simple X icon component
interface XIconProps {
  className?: string;
}

const X = ({ className = "" }: XIconProps) => (
  <span className={`inline-block w-4 h-4 ${className}`}>×</span>
);

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

  // Update derived class name when selected level changes
  useEffect(() => {
    const name =
      schoolLevels.find((l) => l.code === selectedLevel)?.display_name ||
      selectedLevel;
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
        const existingClass = classes.find((c) => c.name === derivedClassName);

        if (existingClass) {
          const classWithSubjects = await classesAPI.getClass(existingClass.id);
          setSubjects(classWithSubjects.subjects.map((s) => s.name));
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
      // Ensure all custom subject names exist in global subjects list
      const currentSubjects = [...allSubjects];
      const missing = subjects.filter(
        (name) => !currentSubjects.some((s) => s.name === name)
      );
      if (missing.length > 0) {
        for (const name of missing) {
          // create a simple code from the name
          const code = name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 6)
            .toUpperCase();
          try {
            const created = await classesAPI.createSubject(
              { name, code },
              token || undefined
            );
            currentSubjects.push(created);
          } catch (err) {
            console.warn("Failed to create subject:", name, err);
          }
        }
        // refresh allSubjects state
        setAllSubjects(currentSubjects);
      }
      // First, check if class already exists
      const classes = await classesAPI.getClassesByLevel(selectedLevel);
      const existingClass = classes.find((c) => c.name === derivedClassName);

      let classId: number;

      if (existingClass) {
        // Update existing class
        const subjectIds = currentSubjects
          .filter((s) => subjects.includes(s.name))
          .map((s) => s.id);
        await classesAPI.updateClassSubjects(
          existingClass.id,
          subjectIds,
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
        const subjectIds = currentSubjects
          .filter((s) => subjects.includes(s.name))
          .map((s) => s.id);
        if (subjectIds.length > 0) {
          await classesAPI.updateClassSubjects(classId, subjectIds, token);
        }
      }

      setMessage(
        `✓ Class "${derivedClassName}" saved successfully with subjects!`
      );
      setSubjects([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loadingLevels) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-white text-xl">Loading school levels...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="w-full max-w-2xl mx-auto">
        <Card className="p-6 md:p-8 shadow-lg border-0">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                {selectedLevel ? "Update Class" : "Create New Class"}
              </h1>
              <p className="text-slate-500 text-sm">
                {selectedLevel
                  ? `Manage ${derivedClassName || "class"} details and subjects`
                  : "Select a school level to get started"}
              </p>
            </div>

            {message && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateClass} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="school-level"
                  className="text-slate-700 font-medium block mb-1"
                >
                  School Level
                </Label>
                <select
                  id="school-level"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a level</option>
                  {schoolLevels.map((level) => (
                    <option key={level.code} value={level.code}>
                      {level.display_name} ({level.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Class Name</Label>
                <div className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm">
                  {derivedClassName || (
                    <span className="text-slate-400">
                      Select a level to see class name
                    </span>
                  )}
                </div>
              </div>

              {/* Subjects Management */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">
                  Subjects for this class
                </Label>

                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  {subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((subject, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-white text-slate-700 text-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-xs"
                        >
                          {subject}
                          <button
                            type="button"
                            onClick={() => removeSubject(subject)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-2">
                      No subjects added yet
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Enter subject name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addCustomSubject}
                      variant="outline"
                      disabled={!newSubject.trim()}
                      className="whitespace-nowrap"
                    >
                      Add Subject
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={loading || !selectedLevel}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Class"
                  )}
                </Button>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/admin")}
                    className="flex-1 h-9 text-slate-700"
                  >
                    Dashboard
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1 h-9 text-slate-700"
                  >
                    Back
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
