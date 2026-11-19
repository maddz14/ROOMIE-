import { withApi, readJson, asString, asInt } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";

export const GET = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
    const r = await db.resource.findUnique({
      where: { id },
      include: { facilities: { include: { facility: true } } },
    });
    if (!r) throw ERR.TIDAK_DITEMUKAN("Ruang tidak ditemukan.");
    return ctx.json({
      ruang: {
        id: r.id,
        kode: r.kode,
        nama: r.nama,
        tipe: r.tipe,
        gedung: r.gedung,
        lantai: r.lantai,
        kapasitas: r.kapasitas,
        deskripsi: r.deskripsi,
        isActive: r.isActive === 1,
        fasilitas: r.facilities.map((rf) => ({
          facilityId: rf.facilityId,
          nama: rf.facility.nama,
          satuan: rf.facility.satuan,
          jumlah: rf.jumlah,
        })),
      },
    });
  },
  { roles: ["admin"] },
);

export const PATCH = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const existing = await db.resource.findUnique({ where: { id } });
    if (!existing) throw ERR.TIDAK_DITEMUKAN("Ruang tidak ditemukan.");

    const fields: Record<string, string> = {};
    const data: any = {};
    if (typeof body.kode === "string") {
      data.kode = body.kode.trim().toUpperCase();
      if (data.kode.length < 2) fields.kode = "Kode ruang minimal 2 karakter.";
      else {
        const dup = await db.resource.findUnique({ where: { kode: data.kode } });
        if (dup && dup.id !== id) fields.kode = "Kode ruang sudah dipakai.";
      }
    }
    if (typeof body.nama === "string") {
      data.nama = body.nama.trim();
      if (data.nama.length < 2) fields.nama = "Nama ruang minimal 2 karakter.";
    }
    if (typeof body.tipe === "string") data.tipe = body.tipe;
    if (body.gedung !== undefined) data.gedung = typeof body.gedung === "string" ? body.gedung.trim() || null : null;
    if (body.lantai !== undefined) data.lantai = typeof body.lantai === "string" ? body.lantai.trim() || null : null;
    if (body.kapasitas !== undefined) {
      data.kapasitas = asInt(body.kapasitas, "kapasitas");
      if (data.kapasitas < 0) fields.kapasitas = "Kapasitas tidak boleh negatif.";
    }
    if (body.deskripsi !== undefined)
      data.deskripsi = typeof body.deskripsi === "string" ? body.deskripsi.trim() || null : null;
    if (body.isActive !== undefined) data.isActive = body.isActive === true ? 1 : 0;

    if (Object.keys(fields).length > 0) throw ERR.INPUT_TIDAK_VALID(fields);

    // peringatan bila menonaktifkan ruang dengan booking mendatang
    let peringatanMendatang = 0;
    if (data.isActive === 0) {
      peringatanMendatang = await db.booking.count({
        where: {
          resourceId: id,
          status: { in: ["menunggu_kemahasiswaan", "menunggu_ga", "disetujui"] },
        },
      });
    }

    await db.resource.update({ where: { id }, data });
    if (Object.keys(fields).length === 0) {
      await db.auditLog.create({
        data: {
          userId: ctx.user!.id,
          aksi: "ubah_ruang",
          tabel: "resources",
          recordId: id,
          detail: "update",
        },
      });
    }

    // sinkron fasilitas
    if (Array.isArray(body.fasilitas)) {
      await db.resourceFacility.deleteMany({ where: { resourceId: id } });
      const fdata = (body.fasilitas as any[])
        .filter((f) => f && f.facilityId)
        .map((f) => ({
          resourceId: id,
          facilityId: parseInt(f.facilityId, 10),
          jumlah: parseInt(f.jumlah, 10) || 1,
        }));
      if (fdata.length > 0) await db.resourceFacility.createMany({ data: fdata });
    }

    return ctx.json({ ok: true, peringatanMendatang });
  },
  { roles: ["admin"] },
);

export const DELETE = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
    // jangan hapus fisik, nonaktifkan
    await db.resource.update({ where: { id }, data: { isActive: 0 } });
    await db.auditLog.create({
      data: {
        userId: ctx.user!.id,
        aksi: "nonaktif_ruang",
        tabel: "resources",
        recordId: id,
        detail: "deactivate",
      },
    });
    return ctx.json({ ok: true });
  },
  { roles: ["admin"] },
);
