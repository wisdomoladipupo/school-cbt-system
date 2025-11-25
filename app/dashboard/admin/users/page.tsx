"use client";

import { useState, useEffect, useCallback } from "react";
import { usersAPI, classesAPI, User, Class } from "@/lib/api";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string>("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student" as "admin" | "teacher" | "student",
    class_id: "" as string,
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    password: "",
    role: "student" as "admin" | "teacher" | "student",
  });

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      setErrorMsg("No authentication token found. Please login first.");
      setLoading(false);
    }
  }, []);

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    try {
      const classesData = await classesAPI.listClasses();
      setClasses(classesData);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  }, []);

  // Fetch users callback
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await usersAPI.list(token);
      setUsers(response);
      setErrorMsg("");
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setErrorMsg("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch users on mount or when token changes
  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchClasses();
    }
  }, [token, fetchUsers, fetchClasses]);

  const handleAddUser = async () => {
    if (!form.full_name || !form.email || !form.password) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const newUser = await usersAPI.create(
        {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
        },
        token
      );
      
      // If student and class is selected, assign to class
      if (form.role === "student" && form.class_id) {
        try {
          await classesAPI.assignStudentToClass(
            parseInt(form.class_id),
            newUser.id,
            token
          );
        } catch (err) {
          console.error("Failed to assign student to class:", err);
          // Don't fail the user creation if class assignment fails
        }
      }

      setUsers([...users, newUser]);
      setForm({ full_name: "", email: "", password: "", role: "student", class_id: "" });
      setShowModal(false);
      setErrorMsg("");
    } catch (err) {
      console.error("Failed to add user:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to add user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({
      full_name: user.full_name,
      password: "",
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.full_name) {
      setErrorMsg("Please enter a full name");
      return;
    }

    try {
      setIsSubmitting(true);
      const updates: { full_name?: string; password?: string; role?: string } = {
        full_name: editForm.full_name,
        role: editForm.role,
      };
      if (editForm.password) {
        updates.password = editForm.password;
      }

      const updated = await usersAPI.update(editingUserId!, updates, token);
      setUsers(users.map((u) => (u.id === editingUserId ? updated : u)));
      setShowEditModal(false);
      setEditingUserId(null);
      setErrorMsg("");
    } catch (err) {
      console.error("Failed to update user:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await usersAPI.delete(userId, token);
      setUsers(users.filter((u) => u.id !== userId));
      setErrorMsg("");
    } catch (err) {
      console.error("Failed to delete user:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add User
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* User Table */}
      <div className="bg-white shadow rounded p-4">
        {loading ? (
          <p className="text-gray-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">No users added yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Role</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="border p-2">{u.full_name}</td>
                  <td className="border p-2">{u.email}</td>
                  <td className="border p-2 capitalize">{u.role}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleEditUser(u)}
                      className="bg-blue-500 text-white px-3 py-1 rounded mr-2 hover:bg-blue-600"
                      disabled={isSubmitting}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id, u.full_name)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      disabled={isSubmitting}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-xl font-bold mb-4">Add User</h2>

            <input
              type="text"
              placeholder="Full Name"
              className="border w-full p-2 mb-3 rounded"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />

            <input
              type="email"
              placeholder="Email"
              className="border w-full p-2 mb-3 rounded"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              placeholder="Password"
              className="border w-full p-2 mb-3 rounded"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <select
              className="border w-full p-2 mb-3 rounded"
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as "admin" | "teacher" | "student",
                })
              }
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>

            {form.role === "student" && (
              <select
                className="border w-full p-2 mb-3 rounded"
                value={form.class_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    class_id: e.target.value,
                  })
                }
              >
                <option value="">-- Select Class (Optional) --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.level})
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-400"
                onClick={handleAddUser}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>

            <input
              type="text"
              placeholder="Full Name"
              className="border w-full p-2 mb-3 rounded"
              value={editForm.full_name}
              onChange={(e) =>
                setEditForm({ ...editForm, full_name: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Password (leave empty to keep current)"
              className="border w-full p-2 mb-3 rounded"
              value={editForm.password}
              onChange={(e) =>
                setEditForm({ ...editForm, password: e.target.value })
              }
            />

            <select
              className="border w-full p-2 mb-3 rounded"
              value={editForm.role}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  role: e.target.value as "admin" | "teacher" | "student",
                })
              }
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUserId(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-400"
                onClick={handleSaveEdit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
