"use client";

import React, { useEffect, useState } from "react";
import {
  getStoredUser,
  clearStoredAuth,
  usersAPI,
  getStoredToken,
} from "../../lib/api";
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
      {/* Modern Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white flex flex-col h-screen sticky top-0 shadow-xl">
        <div className="p-6 pb-2">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">School CBT</h1>
              <p className="text-indigo-200 text-xs font-medium tracking-wide uppercase">
                {userRole} Portal
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-indigo-700/50 group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3 text-indigo-300 group-hover:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Dashboard
            </Link>

            {userRole === "admin" && (
              <>
                <Link
                  href="/dashboard/admin/users"
                  className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-indigo-700/50 group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-indigo-300 group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Manage Users
                </Link>
                <Link
                  href="/exam/create"
                  className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-indigo-700/50 group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-indigo-300 group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Create Exam
                </Link>
              </>
            )}

            {(userRole === "teacher" || userRole === "admin") && (
              <Link
                href="/exam/manage"
                className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-indigo-700/50 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3 text-indigo-300 group-hover:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Manage Exams
              </Link>
            )}

            {userRole === "student" && (
              <Link
                href="/exam"
                className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-indigo-700/50 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3 text-indigo-300 group-hover:text-white"
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
                Take Exam
              </Link>
            )}

            {(userRole === "admin" || userRole === "teacher") && (
              <Link
                href="/results"
                className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-indigo-700/50 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3 text-indigo-300 group-hover:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Results
              </Link>
            )}
          </nav>
        </div>

        <div className="p-6 pt-4 mt-auto">
          <div className="border-t border-indigo-700 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-sm font-medium text-white shadow-md hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
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
                  <img
                    src={userPassport}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  <div>
                    Welcome, <span className="font-semibold">{userName}</span>
                  </div>
                  {userReg && (
                    <div className="text-xs text-gray-500">Reg#: {userReg}</div>
                  )}
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
