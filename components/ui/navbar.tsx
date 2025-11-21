"use client";

import React from "react";
import Link from "next/link";
import { getCurrentUser, logout } from "@/lib/session";

export default function Navbar() {
  // Direct synchronous read – no state needed
  const user = getCurrentUser();  

  return (
    <nav className="w-full bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-blue-600">School CBT System</h1>

      <div className="flex items-center gap-6">
        
        {user && (
          <div className="text-gray-700 capitalize">
            {user.name} ({user.role})
          </div>
        )}

        <Link
          href="/dashboard"
          className="text-gray-700 hover:text-blue-600"
        >
          Dashboard
        </Link>

        {user && (
          <button
            onClick={() => {
              logout();
              window.location.href = "/auth/login";
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
