// frontend/components/ui/Navbar.tsx
"use client";

import React from "react";
import { logout, getCurrentUser } from "@/lib/session";

interface NavbarProps {
  userRole: "admin" | "teacher" | "student";
}

const Navbar: React.FC<NavbarProps> = ({ userRole }) => {
  const user = getCurrentUser();

  return (
    <nav className="w-full bg-white shadow-md border-b border-gray-200 px-6 py-3 flex justify-between items-center">
      {/* Logo / Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900">School CBT</h1>
      </div>

      {/* Links / Actions */}
      <div className="flex items-center gap-4">
        {userRole === "admin" && (
          <>
            <button className="px-3 py-1 text-gray-700 hover:text-indigo-600">Dashboard</button>
            <button className="px-3 py-1 text-gray-700 hover:text-indigo-600">Students</button>
            <button className="px-3 py-1 text-gray-700 hover:text-indigo-600">Teachers</button>
          </>
        )}

        {userRole === "teacher" && (
          <>
            <button className="px-3 py-1 text-gray-700 hover:text-indigo-600">My Classes</button>
            <button className="px-3 py-1 text-gray-700 hover:text-indigo-600">Exams</button>
          </>
        )}

        {userRole === "student" && (
          <>
            <button className="px-3 py-1 text-gray-700 hover:text-indigo-600">Exams</button>
            <button className="px-3 py-1 text-gray-700 hover:text-indigo-600">Results</button>
          </>
        )}

        {/* User Info / Logout */}
        {user && (
          <div className="flex items-center gap-3 ml-4">
            {user.passport ? (
              <img
                src={user.passport}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                N/A
              </div>
            )}
            <span className="text-gray-800 font-medium">{user.name}</span>
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
