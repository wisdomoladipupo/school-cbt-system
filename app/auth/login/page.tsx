"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser } from "../../../lib/db"; // now exists
import { getCurrentUser } from "../../../lib/session";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      if (user.role === "admin") router.push("/dashboard/admin");
      else if (user.role === "teacher") router.push("/dashboard/teacher");
      else router.push("/dashboard/student");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await getUser(email, password);
    if (!user) {
      setError("Invalid email or password");
      return;
    }
    localStorage.setItem("currentUser", JSON.stringify(user));

    if (user.role === "admin") router.push("/dashboard/admin");
    else if (user.role === "teacher") router.push("/dashboard/teacher");
    else router.push("/dashboard/student");
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-blue-400 to-indigo-600">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          Login
        </h1>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block mb-1 font-semibold">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <label className="block mb-1 font-semibold">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600 dark:text-gray-300">
          Don't have an account?{" "}
          <Link
            href="/auth/register"
            className="text-indigo-600 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
