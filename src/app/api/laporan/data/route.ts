import { withApi } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { buildFilter } from "../ringkasan/route";
import { serializeBooking } from "@/lib/serialize";

export const GET = withApi(
  async (ctx) => {
    const where = await buildFilter(ctx);
    const rows = await db.booking.findMany({
      where,
      orderBy: { tanggal: "desc" },
      include: {
        resource: true,
        pemohon: { include: { unit: true } },
        approvals: { include: { approver: true }, orderBy: { tahap: "asc" } },
        facilities: { include: { facility: true } },
        documents: true,
        usageLog: { include: { petugas: true } },
      },
    });
    return ctx.json({
      data: rows.map((b) => serializeBooking(b as any, ctx.user)),
    });
  },
  { roles: ["kemahasiswaan", "ga", "admin"] },
);
