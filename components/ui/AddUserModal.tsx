// components/ui/AddUserModal.tsx
"use client";

import React, { useState } from "react";
import { User, UserRole } from "@/app/dashboard/admin/users/page";

interface AddUserModalProps {
  onClose: () => void;
  onSave: (user: User) => void;
}

const generateRegNumber = (): string => {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const randomLetters = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `NG/GRA/${randomDigits}${randomLetters}`;
};

export default function AddUserModal({ onClose, onSave }: AddUserModalProps) {
  const [role, setRole] = useState<UserRole>("student");
  const [name, setName] = useState<string>("");
  const [passport, setPassport] = useState<string | undefined>(undefined);

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
      alert("Please enter a name.");
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      role,
      passport,
      regNumber: role === "student" ? generateRegNumber() : undefined,
    };

    onSave(newUser);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl z-10 space-y-4">
        <h2 className="text-xl font-bold">Add New User</h2>

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
              value={generateRegNumber()} // show example; it's readonly for consistency
              readOnly
              className="border rounded-lg px-3 py-2 w-full bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              A registration number will be auto-generated when you save.
            </p>
          </div>
        )}

        <div>
          <label className="block font-medium mb-1">Passport</label>
          <input type="file" accept="image/*" onChange={handleFileUpload} />
          {passport && (
            <img src={passport} alt="passport" className="w-20 h-20 object-cover mt-3 rounded border" />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
            Save User
          </button>
        </div>
      </div>
    </div>
  );
}
