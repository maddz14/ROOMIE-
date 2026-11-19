import { withApi } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { serializeBooking } from "@/lib/serialize";

export const GET = withApi(
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const tab = url.searchParams.get("tab") === "riwayat" ? "riwayat" : "menunggu";
    const role = ctx.user!.roleNama;
    const tahap = role === "kemahasiswaan" ? 1 : 2;
    const statusMenunggu = role === "kemahasiswaan" ? "menunggu_kemahasiswaan" : "menunggu_ga";

    let where: any;
    if (tab === "menunggu") {
      where = { status: statusMenunggu };
    } else {
      // riwayat: booking yang pernah diputus oleh peran ini
      where = {
        approvals: {
          some: { tahap, approverId: ctx.user!.id, keputusan: { in: ["disetujui", "ditolak"] } },
        },
      };
    }

    const rows = await db.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        resource: true,
        pemohon: { include: { unit: true } },
        approvals: { include: { approver: true }, orderBy: { tahap: "asc" } },
        facilities: { include: { facility: true } },
        documents: true,
        usageLog: { include: { petugas: true } },
      },
      take: 200,
    });

    return ctx.json({
      bookings: rows.map((b) => serializeBooking(b as any, ctx.user)),
    });
  },
  { roles: ["kemahasiswaan", "ga"] },
);
