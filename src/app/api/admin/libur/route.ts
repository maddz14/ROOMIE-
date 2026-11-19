import { withApi, readJson, asString } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";

export const GET = withApi(
  async (ctx) => {
    const rows = await db.holiday.findMany({ orderBy: { tanggal: "asc" } });
    return ctx.json({ libur: rows });
  },
  { roles: ["admin"] },
);

export const POST = withApi(
  async (ctx) => {
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const tanggal = asString(body.tanggal, "tanggal");
    const keterangan = asString(body.keterangan, "keterangan").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal))
      throw ERR.INPUT_TIDAK_VALID({ tanggal: "Format tanggal tidak valid." });
    if (keterangan.length < 3)
      throw ERR.INPUT_TIDAK_VALID({ keterangan: "Keterangan minimal 3 karakter." });
    const h = await db.holiday.upsert({
      where: { tanggal },
      update: { keterangan },
      create: { tanggal, keterangan },
    });
    await db.auditLog.create({
      data: { userId: ctx.user!.id, aksi: "tambah_libur", tabel: "holidays", recordId: 0, detail: tanggal },
    });
    return ctx.json({ libur: h }, 201);
  },
  { roles: ["admin"] },
);
