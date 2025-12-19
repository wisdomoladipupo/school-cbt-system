"use client";

import { useState, useEffect, useCallback } from "react";
import { usersAPI, classesAPI } from "@/lib/api/api";
import { Class as ApiClass } from "@/lib/api";
import UsersTable from "../usersTable";

// Define User type with all required fields
type User = {
  id: number;
  full_name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  reg_number?: string;
  passport?: string;
  class_id?: number;
  created_at?: string;
  updated_at?: string;
};

type UserFormData = {
  full_name: string;
  email: string;
  password: string;
  role: "admin" | "teacher" | "student";
  class_id: string | number;
  passport: string;
};

type EditUserFormData = {
  full_name: string;
  password: string;
  role: "admin" | "teacher" | "student";
  class_id: string | number;
  passport: string;
};

type DetailsEditFormProps = {
  user: User;
  classes: ApiClass[];
  token: string;
  onCancel: () => void;
  onSave: (updatedUser: User, classId?: number | null) => void;
};

function DetailsEditForm({
  user,
  classes,
  token,
  onCancel,
  onSave,
}: DetailsEditFormProps) {
  const [fullName, setFullName] = useState(user.full_name);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user.role);
  const [passport, setPassport] = useState<string | null>(
    user.passport || null
  );
  const [classId, setClassId] = useState<number | null>(user.class_id || null);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const updates: any = { full_name: fullName, role };
      if (password) updates.password = password;
      if (passport) updates.passport = passport;

      const updated = await usersAPI.update(user.id, updates, token);
      onSave(updated, classId);
    } catch (err) {
      console.error("Failed saving details:", err);
      alert(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Full name</label>
      <input
        className="w-full border p-2 rounded"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      <label className="block text-sm font-medium">
        Password (leave empty to keep)
      </label>
      <input
        type="password"
        className="w-full border p-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <label className="block text-sm font-medium">Role</label>
      <select
        className="w-full border p-2 rounded"
        value={role}
        onChange={(e) => setRole(e.target.value as any)}
      >
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
      </select>

      <label className="block text-sm font-medium">Passport Photo</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => setPassport(reader.result as string);
          reader.readAsDataURL(file);
        }}
      />

      {role === "student" && (
        <>
          <label className="block text-sm font-medium">Class</label>
          <select
            className="w-full border p-2 rounded"
            value={classId ?? ""}
            onChange={(e) =>
              setClassId(e.target.value ? parseInt(e.target.value) : null)
            }
          >
            <option value="">(none)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>
        </>
      )}

      <div className="flex justify-end gap-2">
        <button
          className="px-3 py-1 bg-gray-300 rounded"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={handleSave}
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ApiClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsEditMode, setDetailsEditMode] = useState(false);
  const [token, setToken] = useState<string>("");
  const [backendHealth, setBackendHealth] = useState<string | null>(null);

  const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  ).replace(/\/$/, "");

  const [form, setForm] = useState<UserFormData>({
    full_name: "",
    email: "",
    password: "",
    role: "student",
    class_id: "",
    passport: "",
  });

  const [editForm, setEditForm] = useState<EditUserFormData>({
    full_name: "",
    password: "",
    role: "student",
    class_id: "",
    passport: "",
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

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await usersAPI.list(token);
      setUsers(response);
      setErrorMsg("");
      setBackendHealth(null);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setErrorMsg("Failed to load users");
      setBackendHealth(`Backend error: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch data on mount
  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchClasses();
    }
  }, [token, fetchUsers, fetchClasses]);

  const handleAddUser = async () => {
    if (!form.full_name || !form.email || !form.password) {
      setErrorMsg("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(form.passport && { passport: form.passport }),
      };

      const newUser = await usersAPI.create(payload, token);

      // Note: Removed automatic class assignment to prevent unwanted exam creation
      // Class assignment should be done separately through the class management interface

      setUsers([...users, newUser]);
      setForm({
        full_name: "",
        email: "",
        password: "",
        role: "student",
        class_id: "",
        passport: "",
      });
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
      passport: user.passport || "",
      class_id: user.class_id || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUserId || !editForm.full_name) {
      setErrorMsg("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const updates: any = {
        full_name: editForm.full_name,
        role: editForm.role,
      };

      if (editForm.password) updates.password = editForm.password;
      if (editForm.passport) updates.passport = editForm.passport;

      const updatedUser = await usersAPI.update(editingUserId, updates, token);

      // Update class assignment if needed
      if (editForm.role === "student" && editForm.class_id) {
        try {
          await classesAPI.assignStudentToClass(
            Number(editForm.class_id),
            editingUserId,
            token
          );
        } catch (err) {
          console.error("Failed to update class assignment:", err);
        }
      }

      setUsers(users.map((u) => (u.id === editingUserId ? updatedUser : u)));
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

  const handleViewDetails = (user: User) => {
    setViewingUser(user);
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
          <div className="font-medium">{errorMsg}</div>
          <div className="text-xs text-gray-500">API base: {API_BASE_URL}</div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <UsersTable
            users={users}
            onEdit={handleEditUser}
            onDelete={(id) => {
              const user = users.find((u) => u.id.toString() === id);
              if (user) {
                handleDeleteUser(user.id, user.full_name);
              }
            }}
            onViewDetails={handleViewDetails}
            loading={loading}
          />
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] my-8 flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-white">Add New User</h2>
              <p className="text-blue-100 text-sm mt-1">
                Fill in the user details below
              </p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 appearance-none"
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
              </div>

              {form.role === "student" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Class (Optional)
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 appearance-none"
                    value={form.class_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        class_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select a class (optional)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Profile Photo
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-8 h-8 mb-2 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        ></path>
                      </svg>
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold text-blue-600 hover:text-blue-500">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, JPEG (Max 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () =>
                          setForm({
                            ...form,
                            passport: reader.result as string,
                          });
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
                {form.passport && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ Photo selected
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 rounded-b-xl">
              <button
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors flex items-center"
                onClick={handleAddUser}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  "Add User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">User Details</h2>

            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                {viewingUser.passport ? (
                  <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200">
                    <img
                      src={viewingUser.passport}
                      alt={`${viewingUser.full_name}'s passport`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/default-avatar.png";
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-2xl text-gray-400">
                      {viewingUser.full_name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold">
                  {viewingUser.full_name}
                </h3>
                <p className="text-gray-600">{viewingUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium capitalize">{viewingUser.role}</p>
                </div>
                {viewingUser.reg_number && (
                  <div>
                    <p className="text-sm text-gray-500">Registration Number</p>
                    <p className="font-medium">{viewingUser.reg_number}</p>
                  </div>
                )}
                {viewingUser.class_id && (
                  <div>
                    <p className="text-sm text-gray-500">Class</p>
                    <p className="font-medium">
                      {classes.find((c) => c.id === viewingUser.class_id)
                        ?.name || "N/A"}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Account Created</p>
                  <p className="font-medium">
                    {viewingUser.created_at
                      ? new Date(viewingUser.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
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
              placeholder="New Password (leave blank to keep current)"
              className="border w-full p-2 mb-3 rounded"
              value={editForm.password}
              onChange={(e) =>
                setEditForm({ ...editForm, password: e.target.value })
              }
            />

            <div className="mb-3">
              <label className="block mb-1 font-semibold">Passport Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () =>
                    setEditForm({
                      ...editForm,
                      passport: reader.result as string,
                    });
                  reader.readAsDataURL(file);
                }}
              />
            </div>

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

            {editForm.role === "student" && (
              <select
                className="border w-full p-2 mb-3 rounded"
                value={editForm.class_id}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    class_id: e.target.value,
                  })
                }
              >
                <option value="">-- Select Class --</option>
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
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold mb-2">User Details</h2>
              <div className="space-x-2">
                {!detailsEditMode && (
                  <button
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                    onClick={() => setDetailsEditMode(true)}
                  >
                    Edit
                  </button>
                )}
                <button
                  className="px-3 py-1 bg-gray-300 rounded"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
                    setDetailsEditMode(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Avatar/Passport */}
            <div className="mb-4">
              {selectedUser.passport ? (
                <img
                  src={selectedUser.passport}
                  alt="passport"
                  className="w-24 h-24 rounded object-cover border"
                />
              ) : (
                <div className="w-24 h-24 rounded bg-gray-100 flex items-center justify-center text-xl font-semibold">
                  {selectedUser.full_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Details Form / View */}
            {!detailsEditMode ? (
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Name: </span>
                  {selectedUser.full_name}
                </div>
                <div>
                  <span className="font-semibold">Email: </span>
                  {selectedUser.email}
                </div>
                <div>
                  <span className="font-semibold">Role: </span>
                  {selectedUser.role}
                </div>
                <div>
                  <span className="font-semibold">Registration #: </span>
                  {selectedUser.reg_number || "(none)"}
                </div>
                <div>
                  <span className="font-semibold">Class: </span>
                  {selectedUser.class_id
                    ? classes.find((c) => c.id === selectedUser.class_id)
                        ?.name || "(none)"
                    : "(none)"}
                </div>
                <div className="pt-3">
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded"
                    onClick={async () => {
                      if (!window.confirm(`Delete ${selectedUser.full_name}?`))
                        return;
                      try {
                        setIsSubmitting(true);
                        await usersAPI.delete(selectedUser.id, token);
                        setUsers(users.filter((u) => u.id !== selectedUser.id));
                        setShowDetailsModal(false);
                        setSelectedUser(null);
                        setErrorMsg("");
                      } catch (err) {
                        setErrorMsg(
                          err instanceof Error
                            ? err.message
                            : "Failed to delete user"
                        );
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    Delete User
                  </button>
                </div>
              </div>
            ) : (
              <DetailsEditForm
                user={selectedUser}
                classes={classes}
                token={token}
                onCancel={() => setDetailsEditMode(false)}
                onSave={async (updatedUser: User, classId?: number | null) => {
                  // Update local list
                  setUsers(
                    users.map((u) =>
                      u.id === updatedUser.id ? updatedUser : u
                    )
                  );

                  // Assign to class if provided
                  if (classId && updatedUser.role === "student") {
                    try {
                      await classesAPI.assignStudentToClass(
                        classId,
                        updatedUser.id,
                        token
                      );
                    } catch (e) {
                      console.warn(
                        "Failed to assign class in details modal:",
                        e
                      );
                    }
                  }

                  setSelectedUser(updatedUser);
                  setDetailsEditMode(false);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
