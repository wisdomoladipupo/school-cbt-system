// components/admin/UsersTable.tsx
"use client";

import React from "react";
import { User } from "@/app/dashboard/admin/users/page";

interface UsersTableProps {
  users: User[];
  onDelete: (id: string) => void;
}

export default function UsersTable({ users, onDelete }: UsersTableProps) {
  if (!users || users.length === 0) {
    return <div className="text-gray-500">No users yet. Add one to continue.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2">Name</th>
            <th className="py-2">Role</th>
            <th className="py-2">Reg Number</th>
            <th className="py-2">Passport</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="py-3 align-top">{u.name}</td>
              <td className="py-3 capitalize">{u.role}</td>
              <td className="py-3">{u.regNumber ?? "—"}</td>
              <td className="py-3">
                {u.passport ? (
                  <img src={u.passport} alt={`${u.name} passport`} className="w-12 h-12 object-cover rounded" />
                ) : (
                  "—"
                )}
              </td>
              <td className="py-3 text-right">
                <button
                  onClick={() => onDelete(u.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
