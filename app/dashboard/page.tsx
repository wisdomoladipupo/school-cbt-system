"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      // Not logged in, redirect to login
      router.push("/auth/login");
      return;
    }

    // Redirect based on role
    if (user.role === "admin") {
      router.push("/dashboard/admin");
    } else if (user.role === "teacher") {
      router.push("/dashboard/teacher");
    } else {
      router.push("/dashboard/student");
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
