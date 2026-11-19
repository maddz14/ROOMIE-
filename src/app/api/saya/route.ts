import { withApi, readJson } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";

export const GET = withApi(async (ctx) => {
  // ctx.user already contains the user
  return ctx.json({ user: ctx.user });
});

export const PATCH = withApi(async (ctx) => {
  const body = (await readJson(ctx.req)) as Record<string, unknown>;
  const u = await db.user.findUnique({
    where: { id: ctx.user!.id },
  });
  if (!u) throw ERR.BELUM_MASUK();

  const fields: Record<string, string> = {};
  const nama = typeof body.nama === "string" ? body.nama.trim() : u.nama;
  if (nama.length < 2) fields.nama = "Nama lengkap minimal 2 karakter.";
  const noHp = typeof body.noHp === "string" ? body.noHp.trim() : u.noHp ?? "";
  const jabatan = typeof body.jabatan === "string" ? body.jabatan.trim() : u.jabatan ?? "";

  // ubah kata sandi bila diminta
  let passwordHash = u.passwordHash;
  if (body.passwordBaru || body.passwordLama) {
    const lama = typeof body.passwordLama === "string" ? body.passwordLama : "";
    const baru = typeof body.passwordBaru === "string" ? body.passwordBaru : "";
    if (!lama) fields.passwordLama = "Masukkan kata sandi lama Anda.";
    const ok = await verifyPassword(lama, u.passwordHash);
    if (!ok) fields.passwordLama = "Kata sandi lama salah.";
    if (baru.length < 8) fields.passwordBaru = "Kata sandi baru minimal 8 karakter.";
    if (!/[a-zA-Z]/.test(baru) || !/\d/.test(baru))
      fields.passwordBaru = "Kata sandi harus memuat huruf dan angka.";
    if (Object.keys(fields).length === 0) {
      passwordHash = await hashPassword(baru);
    }
  }

  if (Object.keys(fields).length > 0) throw ERR.INPUT_TIDAK_VALID(fields);

  await db.user.update({
    where: { id: u.id },
    data: { nama, noHp: noHp || null, jabatan: jabatan || null, passwordHash },
  });

  return ctx.json({ ok: true });
});
