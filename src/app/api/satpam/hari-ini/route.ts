import { withApi } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { serializeBooking } from "@/lib/serialize";
import { tanggalHariIniWIB } from "@/lib/wib";

export const GET = withApi(
  async (ctx) => {
    const hariIni = tanggalHariIniWIB();
    const rows = await db.booking.findMany({
      where: {
        tanggal: hariIni,
        status: { in: ["disetujui", "berlangsung"] },
      },
      orderBy: { jamMulai: "asc" },
      include: {
        resource: true,
        pemohon: { include: { unit: true } },
        approvals: { include: { approver: true } },
        facilities: { include: { facility: true } },
        documents: true,
        usageLog: { include: { petugas: true } },
      },
    });
    return ctx.json({
      tanggal: hariIni,
      bookings: rows.map((b) => serializeBooking(b as any, ctx.user)),
    });
  },
  { roles: ["satpam", "admin"] },
);
