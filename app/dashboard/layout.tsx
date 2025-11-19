"use client";



import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, logout } from "../../lib/session";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userRole, setUserRole] = useState<
    "admin" | "teacher" | "student" | null
  >(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = "/auth/login"; // protect route
      return;
    }
    setUserRole(user.role);
  }, []);

  if (!userRole) return null; // hide layout until user is loaded

  const sidebarItems = {
    admin: [
      { name: "Admin Panel", href: "/dashboard/admin" },
      { name: "Manage Exams", href: "/exams/manage" },
      { name: "Manage Users", href: "/dashboard/admin/users" },
      { name: "View Results", href: "/results" },
    ],
    teacher: [
      { name: "Teacher Panel", href: "/dashboard/teacher" },
      { name: "Create Exam", href: "/exams/create" },
      { name: "Manage Exams", href: "/exams/manage" },
      { name: "Grade Results", href: "/results" },
    ],
    student: [
      { name: "Student Panel", href: "/dashboard/student" },
      { name: "Take Exam", href: "/exams/take" },
      { name: "My Results", href: "/results" },
    ],
  };

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg p-5 hidden md:flex flex-col">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

        <nav className="flex flex-col gap-3">
          {sidebarItems[userRole].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">School CBT System</h1>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Logout
          </button>
        </header>

        {/* Page Content */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md min-h-[400px]">
          {children}
        </section>
      </main>
    </div>
  );
}
