import { withApi, readJson, asString, asInt } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const ROLE_VALID = ["peminjam", "kemahasiswaan", "ga", "satpam", "admin"];

export const PATCH = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const existing = await db.user.findUnique({ where: { id }, include: { role: true } });
    if (!existing) throw ERR.TIDAK_DITEMUKAN("Pengguna tidak ditemukan.");

    const data: any = {};
    if (typeof body.nama === "string") {
      data.nama = body.nama.trim();
      if (data.nama.length < 2) throw ERR.INPUT_TIDAK_VALID({ nama: "Nama minimal 2 karakter." });
    }
    if (typeof body.noHp === "string") data.noHp = body.noHp.trim() || null;
    if (typeof body.jabatan === "string") data.jabatan = body.jabatan.trim() || null;
    if (body.unitId !== undefined) {
      data.unitId = body.unitId === null || body.unitId === "" ? null : asInt(body.unitId, "unitId");
    }
    if (typeof body.roleNama === "string") {
      if (!ROLE_VALID.includes(body.roleNama))
        throw ERR.INPUT_TIDAK_VALID({ roleNama: "Peran tidak valid." });
      const role = await db.role.findUnique({ where: { nama: body.roleNama } });
      if (role) data.roleId = role.id;
      // BR: admin tidak dapat menurunkan peran dirinya sendiri
      if (ctx.user!.id === id && body.roleNama !== existing.role.nama) {
        throw ERR.INPUT_TIDAK_VALID({
          roleNama: "Anda tidak dapat mengubah peran akun sendiri.",
        });
      }
    }
    if (body.isActive !== undefined) {
      // admin tidak dapat menonaktifkan dirinya sendiri
      if (ctx.user!.id === id && body.isActive === false) {
        throw ERR.INPUT_TIDAK_VALID({
          isActive: "Anda tidak dapat menonaktifkan akun sendiri.",
        });
      }
      data.isActive = body.isActive === true ? 1 : 0;
    }
    // atur ulang kata sandi
    if (typeof body.passwordBaru === "string" && body.passwordBaru.trim()) {
      if (body.passwordBaru.length < 8)
        throw ERR.INPUT_TIDAK_VALID({ passwordBaru: "Kata sandi minimal 8 karakter." });
      data.passwordHash = await hashPassword(body.passwordBaru);
    }

    await db.user.update({ where: { id }, data });
    await db.auditLog.create({
      data: { userId: ctx.user!.id, aksi: "ubah_pengguna", tabel: "users", recordId: id, detail: "update" },
    });
    return ctx.json({ ok: true });
  },
  { roles: ["admin"] },
);
