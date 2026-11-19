"use client";

import { create } from "zustand";
import { api } from "./api";

export type User = {
  id: number;
  nama: string;
  email: string;
  nimNip: string;
  noHp: string | null;
  jabatan: string | null;
  roleNama: string;
  unitId: number | null;
  unitNama: string | null;
  isActive: number;
  unread: number;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  fetched: boolean;
  fetchUser: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    nama: string;
    nimNip: string;
    email: string;
    noHp: string;
    unitId: string | number;
    password: string;
    konfirmasiPassword: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: Record<string, unknown>) => Promise<void>;
  setUnread: (n: number) => void;
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  fetched: false,
  fetchUser: async () => {
    try {
      const d = await api<{ user: User | null }>("/api/saya");
      set({ user: d.user, fetched: true });
      return d.user;
    } catch {
      set({ user: null, fetched: true });
      return null;
    }
  },
  login: async (email, password) => {
    const d = await api<{ user: User }>("/api/auth/masuk", {
      method: "POST",
      body: { email, password },
    });
    set({ user: d.user, fetched: true });
    return d.user;
  },
  register: async (data) => {
    const d = await api<{ user: User }>("/api/auth/daftar", {
      method: "POST",
      body: data,
    });
    set({ user: d.user, fetched: true });
    return d.user;
  },
  logout: async () => {
    try {
      await api("/api/auth/keluar", { method: "POST" });
    } catch {}
    set({ user: null });
  },
  updateProfile: async (data) => {
    await api("/api/saya", { method: "PATCH", body: data });
    await get().fetchUser();
  },
  setUnread: (n) =>
    set((s) => (s.user ? { user: { ...s.user, unread: n } } : s)),
}));
