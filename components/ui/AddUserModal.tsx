"use client";

import { useState } from "react";

interface AddUserModalProps {
  onClose: () => void;
}

export default function AddUserModal({ onClose }: AddUserModalProps) {

  const [role, setRole] = useState<"student" | "teacher">("student");
  const [passport, setPassport] = useState<string | null>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPassport(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl z-10 space-y-6">

        <h2 className="text-xl font-bold">Add New User</h2>

        {/* ROLE SELECT */}
        <div>
          <label className="block font-medium mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "student" | "teacher")}
            className="border rounded-lg px-3 py-2 w-full"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        {/* FULL NAME */}
        <div>
          <label className="block font-medium mb-1">Full Name</label>
          <input className="border rounded-lg px-3 py-2 w-full" placeholder="John Doe" />
        </div>

        {/* STUDENT ONLY FIELD */}
        {role === "student" && (
          <div>
            <label className="block font-medium mb-1">Registration Number</label>
            <input
              className="border rounded-lg px-3 py-2 w-full"
              placeholder="NG/GRA/1234AB"
            />
          </div>
        )}

        {/* PASSPORT UPLOAD */}
        <div>
          <label className="block font-medium mb-1">Passport</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
          />

          {passport && (
            <img
              src={passport}
              className="w-20 h-20 object-cover mt-3 rounded border"
            />
          )}
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>

          <button className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
            Save User
          </button>
        </div>
      </div>
    </div>
  );
}
