import { create } from "zustand";

export type UserRole = "student" | "teacher";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  regNumber?: string;
  passport?: string;
}

interface UsersStore {
  users: User[];
  addUser: (user: User) => void;
  deleteUser: (id: string) => void;
}

export const useUsersStore = create<UsersStore>((set) => ({
  users: [],

  addUser: (user) =>
    set((state) => ({
      users: [...state.users, user],
    })),

  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),
}));
