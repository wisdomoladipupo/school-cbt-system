"use client";

import React from "react";
import { User } from "@/lib/api";
import { TrashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface UsersTableProps {
  users: User[];
  onDelete: (id: string) => void;
  onEdit: (user: User) => void;
  onViewDetails: (user: User) => void;
  loading?: boolean;
}

export default function UsersTable({
  users,
  onDelete,
  onEdit,
  onViewDetails,
  loading = false,
}: UsersTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-gray-400 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0111.317-2.33M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m0 0a9 9 0 00-9 9"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-500">No users found</h3>
        <p className="mt-1 text-sm text-gray-400">
          Get started by adding a new user
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Registration
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Passport
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {user.full_name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "teacher"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.registration_number || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.passport ? (
                    <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200">
                      <Image
                        src={user.passport || "/default-avatar.png"}
                        alt={`${user.full_name}'s passport`}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "/default-avatar.png";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => onViewDetails(user)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      View
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => onEdit(user)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => onDelete(user.id.toString())}
                      className="text-red-600 hover:text-red-900 flex items-center text-sm"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
