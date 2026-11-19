import { withApi, readJson, asString, asInt } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { TIPE_RUANG } from "@/lib/rules";
import { labelTipe } from "@/lib/serialize";

const TIPE_VALID = TIPE_RUANG.map((t) => t.value);

export const GET = withApi(
  async (ctx) => {
    const rows = await db.resource.findMany({
      orderBy: [{ tipe: "asc" }, { nama: "asc" }],
      include: { facilities: { include: { facility: true } } },
    });
    return ctx.json({
      ruang: rows.map((r) => ({
        id: r.id,
        kode: r.kode,
        nama: r.nama,
        tipe: r.tipe,
        tipeLabel: labelTipe(r.tipe),
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
      })),
    });
  },
  { roles: ["admin"] },
);

export const POST = withApi(
  async (ctx) => {
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const kode = asString(body.kode, "kode").trim().toUpperCase();
    const nama = asString(body.nama, "nama").trim();
    const tipe = asString(body.tipe, "tipe");
    const gedung = typeof body.gedung === "string" ? body.gedung.trim() || null : null;
    const lantai = typeof body.lantai === "string" ? body.lantai.trim() || null : null;
    const kapasitas = asInt(body.kapasitas, "kapasitas");
    const deskripsi = typeof body.deskripsi === "string" ? body.deskripsi.trim() || null : null;
    const isActive = body.isActive !== false;
    const fasilitasRaw = Array.isArray(body.fasilitas) ? body.fasilitas : [];

    const fields: Record<string, string> = {};
    if (kode.length < 2) fields.kode = "Kode ruang minimal 2 karakter.";
    if (nama.length < 2) fields.nama = "Nama ruang minimal 2 karakter.";
    if (!TIPE_VALID.includes(tipe)) fields.tipe = "Jenis ruang tidak valid.";
    if (kapasitas < 0) fields.kapasitas = "Kapasitas tidak boleh negatif.";
    if (Object.keys(fields).length > 0) throw ERR.INPUT_TIDAK_VALID(fields);

    const exists = await db.resource.findUnique({ where: { kode } });
    if (exists) throw ERR.INPUT_TIDAK_VALID({ kode: "Kode ruang sudah dipakai." });

    const created = await db.resource.create({
      data: {
        kode,
        nama,
        tipe,
        gedung,
        lantai,
        kapasitas,
        deskripsi,
        isActive: isActive ? 1 : 0,
      },
    });

    // fasilitas
    const fdata = (fasilitasRaw as any[])
      .filter((f) => f && f.facilityId)
      .map((f) => ({
        resourceId: created.id,
        facilityId: parseInt(f.facilityId, 10),
        jumlah: parseInt(f.jumlah, 10) || 1,
      }));
    if (fdata.length > 0) await db.resourceFacility.createMany({ data: fdata });

    await db.auditLog.create({
      data: {
        userId: ctx.user!.id,
        aksi: "buat_ruang",
        tabel: "resources",
        recordId: created.id,
        detail: kode,
      },
    });
    return ctx.json({ ruang: { id: created.id, kode } }, 201);
  },
  { roles: ["admin"] },
);
