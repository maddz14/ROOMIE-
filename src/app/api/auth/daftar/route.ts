import { withApi, readJson, asString, asInt } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import {
  createSession,
  hashPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";

export const POST = withApi(
  async (ctx) => {
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const nama = asString(body.nama, "nama").trim();
    const nimNip = asString(body.nimNip, "nimNip").trim();
    const email = asString(body.email, "email").trim().toLowerCase();
    const noHp = typeof body.noHp === "string" ? body.noHp.trim() : "";
    const unitIdRaw = body.unitId;
    const password = asString(body.password, "password");
    const konfirmasi = asString(body.konfirmasiPassword, "konfirmasiPassword");

    const fields: Record<string, string> = {};
    if (nama.length < 2) fields.nama = "Nama lengkap minimal 2 karakter.";
    if (!/^\S+@\S+\.\S+$/.test(email)) fields.email = "Format email tidak valid.";
    if (nimNip.length < 3) fields.nimNip = "NIM/NIP minimal 3 karakter.";
    if (password.length < 8)
      fields.password = "Kata sandi minimal 8 karakter.";
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
      fields.password = "Kata sandi harus memuat huruf dan angka.";
    if (password !== konfirmasi)
      fields.konfirmasiPassword = "Konfirmasi kata sandi tidak cocok.";

    let unitId: number | null = null;
    if (unitIdRaw != null && unitIdRaw !== "") {
      try {
        unitId = asInt(unitIdRaw, "unitId");
      } catch {
        fields.unitId = "Unit tidak valid.";
      }
    }

    if (Object.keys(fields).length > 0) throw ERR.INPUT_TIDAK_VALID(fields);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) throw ERR.INPUT_TIDAK_VALID({ email: "Email sudah terdaftar." });
    const existingNim = await db.user.findUnique({ where: { nimNip } });
    if (existingNim) throw ERR.INPUT_TIDAK_VALID({ nimNip: "NIM/NIP sudah dipakai." });

    const role = await db.role.findUnique({ where: { nama: "peminjam" } });
    if (!role) throw ERR.INPUT_TIDAK_VALID({ umum: "Peran peminjam belum dikonfigurasi." });

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        nama,
        nimNip,
        email,
        noHp: noHp || null,
        jabatan: null,
        passwordHash,
        roleId: role.id,
        unitId,
        isActive: 1,
      },
      include: { role: true, unit: true },
    });

    const { cookie } = await createSession(user.id);
    ctx.setCookie(cookie);

    const unread = await db.notification.count({
      where: { userId: user.id, isRead: 0 },
    });
    return ctx.json({
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        nimNip: user.nimNip,
        noHp: user.noHp,
        jabatan: user.jabatan,
        roleNama: user.role.nama,
        unitId: user.unitId,
        unitNama: user.unit?.nama ?? null,
        isActive: user.isActive,
        unread,
      },
    });
  },
  { public: true },
);
