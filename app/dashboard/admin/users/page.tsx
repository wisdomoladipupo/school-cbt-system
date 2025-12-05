"use client";

import { useState, useEffect, useCallback } from "react";
import { usersAPI, classesAPI } from "@/lib/api/api";
import { User, Class } from "@/lib/api";

type DetailsEditFormProps = {
  user: User;
  classes: Class[];
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
  const [role, setRole] = useState(
    user.role as "admin" | "teacher" | "student"
  );
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
  const [classes, setClasses] = useState<Class[]>([]);
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

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student" as "admin" | "teacher" | "student",
    class_id: "" as string,
    passport: "",
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    password: "",
    role: "student" as "admin" | "teacher" | "student",
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

  // Fetch users callback
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await usersAPI.list(token);
      setUsers(response);
      setErrorMsg("");
      setBackendHealth(null); // Clear any previous errors
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setErrorMsg("Failed to load users");
      setBackendHealth(`Backend error: ${err}`);
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

    // Validate: students must be assigned to a class
    if (form.role === "student" && !form.class_id) {
      setErrorMsg("Students must be assigned to a class");
      return;
    }

    try {
      setIsSubmitting(true);

      // Build payload
      const payload: {
        full_name: string;
        email: string;
        password: string;
        role: "student" | "teacher" | "admin";
        student_class?: string;
      } = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role.toLowerCase() as "student" | "teacher" | "admin",
      };

      // Only send student_class if role is student
      if (payload.role === "student" && form.class_id) {
        const selectedClass = classes.find(
          (c) => c.id === parseInt(form.class_id)
        );
        if (selectedClass) {
          payload.student_class = selectedClass.name;
        }
      }
      // include passport if provided
      if ((form as any).passport) {
        (payload as any).passport = (form as any).passport;
      }

      const newUser = await usersAPI.create(payload, token);

      // Assign to class if student
      if (payload.role === "student" && form.class_id) {
        try {
          await classesAPI.assignStudentToClass(
            parseInt(form.class_id),
            newUser.id,
            token
          );
        } catch (err) {
          console.error("Failed to assign student to class:", err);
        }
      }

      setUsers([...users, newUser]);
      setForm({
        full_name: "",
        email: "",
        password: "",
        role: "student",
        class_id: "",
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
      const updates: {
        full_name?: string;
        password?: string;
        role?: string;
        passport?: string;
      } = {
        full_name: editForm.full_name,
        role: editForm.role,
      };
      if (editForm.password) {
        updates.password = editForm.password;
      }
      if ((editForm as any).passport) {
        updates.passport = (editForm as any).passport;
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

      <div className="mb-2 text-sm text-gray-500">{backendHealth}</div>
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
          <div className="font-medium">{errorMsg}</div>
          <div className="text-xs text-gray-500">API base: {API_BASE_URL}</div>
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
                      onClick={() => {
                        setSelectedUser(u);
                        setShowDetailsModal(true);
                        setDetailsEditMode(false);
                      }}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                      disabled={isSubmitting}
                    >
                      Details
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

            <div>
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

            <div>
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

      {/* Details Modal (View + Edit + Delete) */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-96 max-h-[90vh] overflow-auto">
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
                  {selectedUser.registration_number || "(none)"}
                </div>
                <div>
                  <span className="font-semibold">Class: </span>
                  {selectedUser.student_class || "(none)"}
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
                  // update local list
                  setUsers(
                    users.map((u) =>
                      u.id === updatedUser.id ? updatedUser : u
                    )
                  );
                  // assign to class if provided
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
