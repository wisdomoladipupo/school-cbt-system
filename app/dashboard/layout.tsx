"use client";

import React, { useEffect, useState } from "react";
import { getStoredUser, clearStoredAuth, usersAPI, getStoredToken } from "../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userRole, setUserRole] = useState<
    "admin" | "teacher" | "student" | null
  >(null);
  const [userName, setUserName] = useState<string>("");
  const [userPassport, setUserPassport] = useState<string | null>(null);
  const [userReg, setUserReg] = useState<string | null>(null);
  const router = useRouter();

  // Ensure state update is asynchronous to avoid cascading renders
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }
    setTimeout(() => {
      setUserRole(user.role);
      setUserName(user.full_name || "User");
    }, 0);
    // Fetch fresh user details (passport, registration_number)
    (async () => {
      try {
        const token = getStoredToken();
        if (!token) return;
        const fresh = await usersAPI.getCurrentUser(token);
        setUserPassport((fresh as any).passport || null);
        setUserReg((fresh as any).registration_number || null);
        // update stored user so other parts can rely on it
        try {
          localStorage.setItem("currentUser", JSON.stringify(fresh));
        } catch {}
      } catch (e) {
        // ignore fetch errors
      }
    })();
  }, []);

  const handleLogout = () => {
    clearStoredAuth();
    router.push("/auth/login");
  };

  if (!userRole) return null; // Hide layout until user is loaded

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white p-6 shadow-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">School CBT</h1>
          <p className="text-indigo-300 text-sm mt-1 capitalize">
            {userRole} Portal
          </p>
        </div>

        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded hover:bg-indigo-800 transition"
          >
            Dashboard
          </Link>

          {userRole === "admin" && (
            <>
              <Link
                href="/dashboard/admin/users"
                className="block px-4 py-2 rounded hover:bg-indigo-800 transition"
              >
                Manage Users
              </Link>
              <Link
                href="/exam/create"
                className="block px-4 py-2 rounded hover:bg-indigo-800 transition"
              >
                Create Exam
              </Link>
            </>
          )}

          {(userRole === "teacher" || userRole === "admin") && (
            <Link
              href="/exam/manage"
              className="block px-4 py-2 rounded hover:bg-indigo-800 transition"
            >
              Manage Exams
            </Link>
          )}

          {userRole === "student" && (
            <Link
              href="/exam/take"
              className="block px-4 py-2 rounded hover:bg-indigo-800 transition"
            >
              Take Exam
            </Link>
          )}

          {(userRole === "admin" || userRole === "teacher") && (
            <Link
              href="/results"
              className="block px-4 py-2 rounded hover:bg-indigo-800 transition"
            >
              Results
            </Link>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-indigo-800">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {userPassport ? (
                  <img src={userPassport} alt="avatar" className="w-10 h-10 rounded-full object-cover border" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">{userName.charAt(0).toUpperCase()}</div>
                )}
                <div className="text-sm text-gray-600">
                  <div>Welcome, <span className="font-semibold">{userName}</span></div>
                  {userReg && <div className="text-xs text-gray-500">Reg#: {userReg}</div>}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="flex-1 p-6 overflow-auto">{children}</section>
      </main>
    </div>
  );
}
