// components/ui/AddUserModal.tsx
"use client";

import React, { useState } from "react";
import { usersAPI, getStoredToken } from "@/lib/api";

type UserRole = "student" | "teacher";

interface AddUserModalProps {
  onClose: () => void;
  onSave: (user: { id: string; name: string; role: UserRole; regNumber?: string; passport?: string }) => void;
  onError?: (error: string) => void;
}

const generateRegNumber = (): string => {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const randomLetters = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `NG/GRA/${randomDigits}${randomLetters}`;
};

export default function AddUserModal({ onClose, onSave, onError }: AddUserModalProps) {
  const [role, setRole] = useState<UserRole>("student");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passport, setPassport] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPassport(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter an email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter a password.");
      return;
    }

    setIsLoading(true);
    setError("");

    const saveUser = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          throw new Error("Not authenticated. Please login first.");
        }

        const newUserData = await usersAPI.create(
          {
            full_name: name.trim(),
            email: email.trim(),
            password,
            role,
            student_class: role === "teacher" ? undefined : "General",
          },
          token
        );

        onSave({
          id: String(newUserData.id),
          name: newUserData.full_name,
          role,
          regNumber: newUserData.registration_number,
          passport,
        });

        onClose();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to create user";
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    saveUser();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl z-10 space-y-4">
        <h2 className="text-xl font-bold">Add New User</h2>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block font-medium mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="border rounded-lg px-3 py-2 w-full"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="John Doe"
            type="text"
          />
        </div>

        {role === "student" && (
          <div>
            <label className="block font-medium mb-1">Registration Number</label>
            <input
              value={generateRegNumber()}
              readOnly
              className="border rounded-lg px-3 py-2 w-full bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              A registration number will be auto-generated when you save.
            </p>
          </div>
        )}

        <div>
          <label className="block font-medium mb-1">Passport Photo</label>
          <input type="file" accept="image/*" onChange={handleFileUpload} />
          {passport && (
            <img src={passport} alt="passport preview" className="w-20 h-20 object-cover mt-3 rounded border" />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            Save User
          </button>
        </div>
      </div>
    </div>
  );
}
