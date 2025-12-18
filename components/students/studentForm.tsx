import React, { useState, useEffect } from "react";
import { Student } from "./studentCard";
import { classesAPI } from "@/lib/api/api";

interface ClassType {
  id: number;
  name: string;
  level: string;
}

// Update the Student interface to include classId and passport
interface Student {
  id?: number;
  name: string;
  email: string;
  className: string;
  classId?: number;
  regNumber: string;
  passport?: string;
}

interface StudentFormProps {
  initial?: Partial<Student>;
  onSubmit: (student: Student) => void;
  classesList?: ClassType[]; // Renamed from 'classes' to avoid confusion with the state
}

const StudentForm: React.FC<StudentFormProps> = ({
  initial = {},
  onSubmit,
  classesList = [],
}) => {
  const [name, setName] = useState(initial.name || "");
  const [email, setEmail] = useState(initial.email || "");
  const [classes, setClasses] = useState<ClassType[]>(classesList);
  const [selectedClassId, setSelectedClassId] = useState<number | "">(
    initial.classId || ""
  );
  const [passport, setPassport] = useState<string | undefined>(
    initial.passport
  );

  // Generate registration number if not provided
  const regNumber = initial.regNumber || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPassport(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Fetch classes if not provided as prop
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await classesAPI.listClasses();
        setClasses(data);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      }
    };

    if (classesList.length === 0) {
      fetchClasses();
    } else {
      setClasses(classesList);
    }
  }, [classesList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedClass = classes.find((c) => c.id === selectedClassId);
      await onSubmit({
        name,
        email,
        className: selectedClass
          ? `${selectedClass.name} (${selectedClass.level})`
          : "",
        classId: selectedClass ? selectedClass.id : undefined,
        regNumber,
        passport,
        id: initial.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-2xl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
        <h2 className="text-2xl font-bold text-white">
          {initial.id ? "Edit Student" : "Add New Student"}
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          {initial.id
            ? "Update student information"
            : "Fill in the student details below"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="John Doe"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="student@example.com"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Class Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Class <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) =>
                  setSelectedClassId(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                required
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.level})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Registration Number */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Registration Number
            </label>
            <div className="relative">
              <input
                value={regNumber}
                className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-not-allowed"
                readOnly
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Passport Photo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Passport Photo
          </label>
          <div className="mt-1 flex items-center">
            <div className="flex-1">
              {passport ? (
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={passport}
                      alt="Student"
                      className="h-20 w-20 rounded-full object-cover border-2 border-blue-200"
                    />
                    <button
                      type="button"
                      onClick={() => setPassport(undefined)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <span className="text-sm text-green-600">Photo uploaded</span>
                </div>
              ) : (
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handlePassportChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
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
                {initial.id ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>{initial.id ? "Update Student" : "Add Student"}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;
