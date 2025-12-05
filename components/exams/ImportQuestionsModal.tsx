"use client";

import React, { useState, useRef } from "react";
import { getStoredToken } from "@/lib/api";

interface ImportQuestionsModalProps {
  examId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export default function ImportQuestionsModal({
  examId,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: ImportQuestionsModalProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = getStoredToken();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (
      !file.name.endsWith(".docx") &&
      !file.name.endsWith(".doc") &&
      !file.name.endsWith(".DOCX") &&
      !file.name.endsWith(".DOC")
    ) {
      const msg = "Please upload a Word document (.docx or .doc)";
      setError(msg);
      onError?.(msg);
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
        }/api/exams/import-from-document/${examId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Upload failed (${response.status})`
        );
      }

      const data = await response.json();
      setResult(data);
      onSuccess?.(data);
    } catch (err: any) {
      const msg = err.message || "Failed to import questions";
      setError(msg);
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold mb-4">Import Questions from Word</h2>

        {!result && !error && (
          <div>
            <p className="text-gray-600 mb-4 text-sm">
              Upload a Word document (.docx) with questions. Format:
              <br />
              <br />
              1. Question text
              <br />
              A) First option
              <br />
              B) Second option
              <br />
              C) Third option
              <br />
              D) Fourth option
              <br />
              Answer: B
            </p>

            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc"
                onChange={handleFileSelect}
                disabled={uploading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50"
              />
            </div>

            {uploading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Processing...</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <div className="text-green-700 space-y-2">
              <p className="font-semibold">✓ Import Complete!</p>
              <p className="text-sm">
                <strong>{result.questions_created}</strong> questions created
              </p>
              {result.questions_skipped > 0 && (
                <p className="text-sm text-orange-600">
                  {result.questions_skipped} questions skipped (incomplete)
                </p>
              )}
              {result.errors && result.errors.length > 0 && (
                <details className="text-sm mt-2">
                  <summary className="cursor-pointer text-orange-600 font-medium">
                    View errors
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs text-red-600">
                    {result.errors
                      .slice(0, 5)
                      .map((error: string, i: number) => (
                        <li key={i}>• {error}</li>
                      ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium"
          >
            {result ? "Done" : "Cancel"}
          </button>
          {result && (
            <button
              onClick={resetModal}
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 font-medium"
            >
              Import Another
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
