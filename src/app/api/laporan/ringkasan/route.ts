import { withApi } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";

export async function buildFilter(ctx: any) {
  const url = new URL(ctx.req.url);
  const dari = url.searchParams.get("dari") || "";
  const sampai = url.searchParams.get("sampai") || "";
  const ruang = url.searchParams.get("ruang") || "";
  const tipe = url.searchParams.get("tipe") || "";
  const status = url.searchParams.get("status") || "";

  const where: any = {};
  if (dari && sampai) where.tanggal = { gte: dari, lte: sampai };
  else if (dari) where.tanggal = { gte: dari };
  else if (sampai) where.tanggal = { lte: sampai };

  if (status && status !== "semua") where.status = status;

  if (ruang && ruang !== "semua") {
    const rid = parseInt(ruang, 10);
    if (Number.isFinite(rid)) where.resourceId = rid;
  }

  if (tipe && tipe !== "semua") {
    where.resource = { tipe };
  }
  return where;
}

export const GET = withApi(
  async (ctx) => {
    const where = await buildFilter(ctx);
    const rows = await db.booking.findMany({
      where,
      include: {
        resource: true,
        pemohon: { include: { unit: true } },
        usageLog: true,
      },
    });

    const total = rows.length;
    const disetujui = rows.filter((r) => r.status === "disetujui").length;
    const ditolak = rows.filter((r) => r.status === "ditolak").length;
    const dibatalkan = rows.filter((r) => r.status === "dibatalkan").length;
    const selesai = rows.filter((r) => r.status === "selesai").length;
    const berlangsung = rows.filter((r) => r.status === "berlangsung").length;
    const menunggu = rows.filter((r) =>
      ["menunggu_kemahasiswaan", "menunggu_ga"].includes(r.status),
    ).length;
    const kerusakan = rows.filter(
      (r) => r.usageLog?.kondisi === "ada_kerusakan",
    ).length;

    // penggunaan per ruang
    const perRuang = new Map<string, number>();
    for (const r of rows) {
      const key = r.resource?.nama ?? "—";
      perRuang.set(key, (perRuang.get(key) ?? 0) + 1);
    }
    // penggunaan per bulan (YYYY-MM)
    const perBulan = new Map<string, number>();
    for (const r of rows) {
      const key = r.tanggal.slice(0, 7);
      perBulan.set(key, (perBulan.get(key) ?? 0) + 1);
    }

    return ctx.json({
      ringkasan: {
        total,
        disetujui,
        ditolak,
        dibatalkan,
        selesai,
        berlangsung,
        menunggu,
        kerusakan,
      },
      perRuang: [...perRuang.entries()]
        .map(([nama, jumlah]) => ({ nama, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah),
      perBulan: [...perBulan.entries()]
        .map(([bulan, jumlah]) => ({ bulan, jumlah }))
        .sort((a, b) => a.bulan.localeCompare(b.bulan)),
    });
  },
  { roles: ["kemahasiswaan", "ga", "admin"] },
);
