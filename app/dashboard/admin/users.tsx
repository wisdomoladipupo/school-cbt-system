"use client";

import { useState } from "react";
import DashboardLayout from "../layout";
import AddUserModal from "../../../components/ui/AddUserModal";

export default function AdminManageUsersPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        {/* PAGE HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Manage Users</h2>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            + Add New User
          </button>
        </div>

        {/* USERS TABLE */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-4">All Users</h3>

          {/* EMPTY STATE (until database connected) */}
          <div className="text-gray-500">
            No users found. Add a new user to continue.
          </div>
        </div>

        {/* ADD USER MODAL */}
        {showModal && <AddUserModal onClose={() => setShowModal(false)} />}
      </div>
    </DashboardLayout>
  );
}
