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
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsEditMode, setDetailsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

      // Assign to class if student
      if (form.role === "student" && form.class_id) {
        try {
          await classesAPI.assignStudentToClass(
            Number(form.class_id),
            newUser.id,
            token
          );
        } catch (err) {
          console.error("Failed to assign to class:", err);
        }
      }

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
            users={users.map((u) => ({
              id: u.id.toString(),
              name: u.full_name,
              email: u.email,
              role: u.role,
              regNumber: u.reg_number,
              passport: u.passport,
              classId: u.class_id,
            }))}
            onDelete={(id) => {
              const user = users.find((u) => u.id.toString() === id);
              if (user) {
                handleDeleteUser(user.id, user.full_name);
              }
            }}
            loading={loading}
          />
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>

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
                    setForm({ ...form, passport: reader.result as string });
                  reader.readAsDataURL(file);
                }}
              />
            </div>

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
                {isSubmitting ? "Adding..." : "Add User"}
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
