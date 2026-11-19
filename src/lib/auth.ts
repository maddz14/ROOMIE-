// Autentikasi: kata sandi + sesi cookie httpOnly di tabel sessions.

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "./db";
import { ERR } from "./errors";
import { tanggalHariIniWIB } from "./wib";

export const COOKIE_NAME = "roomie_sid";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 jam

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

/** Membuat sesi baru, mengembalikan id sesi dan tanggal kedaluwarsa. */
export async function createSession(userId: number): Promise<{
  sid: string;
  expiresAt: Date;
  cookie: string;
}> {
  const sid = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { id: sid, userId, expiresAt },
  });
  const cookie = `${COOKIE_NAME}=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`;
  return { sid, expiresAt, cookie };
}

/** Perbarui sesi geser (sliding) — perpanjang kedaluwarsa. */
export async function touchSession(sid: string): Promise<string | null> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.update({ where: { id: sid }, data: { expiresAt } });
  return `${COOKIE_NAME}=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`;
}

export async function destroySession(sid: string): Promise<void> {
  await db.session.deleteMany({ where: { id: sid } }).catch(() => {});
}

/** Baca cookie sesi dari header request. */
export function readSid(req: Request): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === COOKIE_NAME && v) return v;
  }
  return null;
}

export type SessionUser = {
  id: number;
  nama: string;
  email: string;
  nimNip: string;
  noHp: string | null;
  jabatan: string | null;
  roleId: number;
  roleNama: string;
  unitId: number | null;
  unitNama: string | null;
  isActive: number;
  unread: number;
};

/** Ambil pengguna dari sesi. Perpanjang kedaluwarsa (sliding). Kembali null jika tidak ada. */
export async function getUserFromRequest(
  req: Request,
): Promise<{ user: SessionUser | null; sid: string | null; cookie: string | null }> {
  const sid = readSid(req);
  if (!sid) return { user: null, sid: null, cookie: null };
  const sess = await db.session.findUnique({ where: { id: sid } });
  if (!sess) return { user: null, sid: null, cookie: null };
  if (sess.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: sid } }).catch(() => {});
    return { user: null, sid: null, cookie: null };
  }
  const u = await db.user.findUnique({
    where: { id: sess.userId },
    include: { role: true, unit: true },
  });
  if (!u || u.isActive !== 1) {
    await db.session.delete({ where: { id: sid } }).catch(() => {});
    return { user: null, sid: null, cookie: null };
  }
  const unread = await db.notification.count({
    where: { userId: u.id, isRead: 0 },
  });
  // perpanjang sesi (sliding)
  const cookie = await touchSession(sid);
  return {
    user: {
      id: u.id,
      nama: u.nama,
      email: u.email,
      nimNip: u.nimNip,
      noHp: u.noHp,
      jabatan: u.jabatan,
      roleId: u.roleId,
      roleNama: u.role.nama,
      unitId: u.unitId,
      unitNama: u.unit?.nama ?? null,
      isActive: u.isActive,
      unread,
    },
    sid,
    cookie,
  };
}

/** Batasi percobaan login gagal per email — 5x gagal -> tahan 5 menit. */
const loginAttempts = new Map<string, { count: number; until: number }>();

export function checkLoginThrottle(email: string): void {
  const e = email.toLowerCase();
  const a = loginAttempts.get(e);
  if (a && a.until > Date.now() && a.count >= 5) {
    const menit = Math.ceil((a.until - Date.now()) / 60000);
    throw ERR.LOGIN_DITAHAN(
      `Terlalu banyak percobaan gagal. Coba lagi dalam ${menit} menit.`,
    );
  }
}

export function recordLoginFailure(email: string): void {
  const e = email.toLowerCase();
  const a = loginAttempts.get(e) ?? { count: 0, until: 0 };
  a.count += 1;
  if (a.count >= 5) {
    a.until = Date.now() + 5 * 60 * 1000;
    a.count = 5;
  }
  loginAttempts.set(e, a);
}

export function clearLoginFailure(email: string): void {
  loginAttempts.delete(email.toLowerCase());
}

/** Hari ini WIB (digunakan ulang di banyak service). */
export function hariIni(): string {
  return tanggalHariIniWIB();
}
