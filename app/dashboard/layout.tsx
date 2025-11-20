"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../../lib/session";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userRole, setUserRole] = useState<"admin" | "teacher" | "student" | null>(null);

  // Ensure state update is asynchronous to avoid cascading renders
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }
    setTimeout(() => setUserRole(user.role), 0);
  }, []);

  if (!userRole) return null; // Hide layout until user is loaded

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      
      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        

        {/* Page Content */}
        <section className="bg-white p-6 rounded-xl shadow-md min-h-[400px]">
          {children}
        </section>
      </main>
    </div>
  );
}
