"use client";

import { useState, useEffect, useCallback } from "react";
import { getStoredToken } from "@/lib/api";
import {  classesAPI, usersAPI, }  from '@/lib/api/api'
import type { User, Class } from "@/lib/api";

export default function TeacherClassManagement() {
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const token = getStoredToken();
  const messageText = typeof message === "string" ? message : JSON.stringify(message);

  const fetchTeacherClasses = useCallback(async () => {
    try {
      const allClasses = await classesAPI.listClasses();
      setMyClasses(allClasses);
    } catch (error) {
      setMessage(
        `Error fetching classes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      // keep this available in case other teacher UI needs subjects later
      await classesAPI.listSubjects();
    } catch (error) {
      // ignore — subjects are not used in this view
    }
  }, []);

  useEffect(() => {
    fetchTeacherClasses();
    fetchSubjects();
  }, [fetchTeacherClasses, fetchSubjects]);

  // Subject request feature removed — teachers should contact an administrator
  // to be assigned to subjects. This component now provides a readonly
  // informational view.

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Subject Requests Disabled</h2>

      {messageText && (
        <div className="mb-4 p-4 rounded bg-green-100 text-green-700">{messageText}</div>
      )}

      <p className="text-sm text-gray-700">
        The teacher "Request Subject Assignment" feature has been disabled. If you
        need to be assigned to teach a subject, please contact an administrator.
      </p>
    </div>
  );
}

