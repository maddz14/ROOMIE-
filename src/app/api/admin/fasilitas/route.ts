import { withApi, readJson, asString } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";

export const GET = withApi(
  async (ctx) => {
    const rows = await db.facility.findMany({ orderBy: { nama: "asc" } });
    return ctx.json({
      fasilitas: rows.map((f) => ({ id: f.id, nama: f.nama, satuan: f.satuan })),
    });
  },
  { roles: ["admin"] },
);

export const POST = withApi(
  async (ctx) => {
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const nama = asString(body.nama, "nama").trim();
    const satuan = typeof body.satuan === "string" && body.satuan.trim() ? body.satuan.trim() : "unit";
    if (nama.length < 2) throw ERR.INPUT_TIDAK_VALID({ nama: "Nama fasilitas minimal 2 karakter." });
    const exists = await db.facility.findUnique({ where: { nama } });
    if (exists) throw ERR.INPUT_TIDAK_VALID({ nama: "Nama fasilitas sudah ada." });
    const f = await db.facility.create({ data: { nama, satuan } });
    await db.auditLog.create({
      data: { userId: ctx.user!.id, aksi: "buat_fasilitas", tabel: "facilities", recordId: f.id, detail: nama },
    });
    return ctx.json({ fasilitas: { id: f.id, nama, satuan } }, 201);
  },
  { roles: ["admin"] },
);
