import { withApi } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";

export const DELETE = withApi(
  async (ctx) => {
    const tanggal = ctx.params.tanggal;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal))
      throw ERR.INPUT_TIDAK_VALID({ tanggal: "Format tanggal tidak valid." });
    try {
      await db.holiday.delete({ where: { tanggal } });
    } catch {
      throw ERR.TIDAK_DITEMUKAN("Hari libur tidak ditemukan.");
    }
    await db.auditLog.create({
      data: { userId: ctx.user!.id, aksi: "hapus_libur", tabel: "holidays", recordId: 0, detail: tanggal },
    });
    return ctx.json({ ok: true });
  },
  { roles: ["admin"] },
);
