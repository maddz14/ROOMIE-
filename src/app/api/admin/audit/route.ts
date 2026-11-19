import { withApi } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { formatWaktu } from "@/lib/wib";

export const GET = withApi(
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const aksi = url.searchParams.get("aksi") || "";
    const where: any = {};
    if (aksi) where.aksi = aksi;
    const rows = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { nama: true } } },
    });
    return ctx.json({
      audit: rows.map((a) => ({
        id: a.id,
        aksi: a.aksi,
        tabel: a.tabel,
        recordId: a.recordId,
        detail: a.detail,
        user: a.user?.nama ?? null,
        createdAt: formatWaktu(a.createdAt),
      })),
    });
  },
  { roles: ["admin"] },
);
