import { withApi, readJson, asString } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";

export const PATCH = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const existing = await db.facility.findUnique({ where: { id } });
    if (!existing) throw ERR.TIDAK_DITEMUKAN("Fasilitas tidak ditemukan.");
    const data: any = {};
    if (typeof body.nama === "string") {
      data.nama = body.nama.trim();
      if (data.nama.length < 2) throw ERR.INPUT_TIDAK_VALID({ nama: "Nama minimal 2 karakter." });
      const dup = await db.facility.findUnique({ where: { nama: data.nama } });
      if (dup && dup.id !== id) throw ERR.INPUT_TIDAK_VALID({ nama: "Nama sudah dipakai." });
    }
    if (typeof body.satuan === "string") data.satuan = body.satuan.trim() || "unit";
    await db.facility.update({ where: { id }, data });
    await db.auditLog.create({
      data: { userId: ctx.user!.id, aksi: "ubah_fasilitas", tabel: "facilities", recordId: id, detail: "update" },
    });
    return ctx.json({ ok: true });
  },
  { roles: ["admin"] },
);

export const DELETE = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
    // cek apakah dipakai di resource atau booking
    const dipakaiResource = await db.resourceFacility.count({ where: { facilityId: id } });
    const dipakaiBooking = await db.bookingFacility.count({ where: { facilityId: id } });
    if (dipakaiResource > 0 || dipakaiBooking > 0) {
      throw ERR.KONFLIK("Fasilitas masih dipakai pada ruang atau booking.");
    }
    await db.facility.delete({ where: { id } });
    await db.auditLog.create({
      data: { userId: ctx.user!.id, aksi: "hapus_fasilitas", tabel: "facilities", recordId: id, detail: "delete" },
    });
    return ctx.json({ ok: true });
  },
  { roles: ["admin"] },
);
