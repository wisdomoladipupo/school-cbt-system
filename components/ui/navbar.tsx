"use client";

import React from "react";
import Link from "next/link";
import { getStoredUser, clearStoredAuth } from "@/lib/api";

export default function Navbar() {
  // Direct synchronous read – no state needed
  const user = getStoredUser();

  return (
    <nav className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">CB</div>
        <h1 className="text-lg font-semibold text-[var(--color-primary)]">School CBT System</h1>
      </div>

      <div className="flex items-center gap-6">
        {user && (
          <div className="text-gray-700 capitalize text-sm">
            {user.full_name} <span className="text-xs text-gray-500">({user.role})</span>
          </div>
        )}

        <Link href="/dashboard" className="text-sm text-gray-700 hover:text-[var(--color-primary)]">
          Dashboard
        </Link>

        {user && (
          <button
            onClick={() => {
              clearStoredAuth();
              window.location.href = "/auth/login";
            }}
            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
