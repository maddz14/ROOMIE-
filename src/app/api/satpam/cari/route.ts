import { withApi } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { serializeBooking } from "@/lib/serialize";

export const GET = withApi(
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const kode = (url.searchParams.get("kode") || "").trim();
    if (!kode) throw ERR.INPUT_TIDAK_VALID({ kode: "Masukkan kode booking." });
    const b = await db.booking.findFirst({
      where: { kodeBooking: { contains: kode } },
      include: {
        resource: true,
        pemohon: { include: { unit: true } },
        approvals: { include: { approver: true }, orderBy: { tahap: "asc" } },
        facilities: { include: { facility: true } },
        documents: true,
        usageLog: { include: { petugas: true } },
      },
    });
    if (!b) throw ERR.TIDAK_DITEMUKAN("Booking dengan kode tersebut tidak ditemukan.");
    return ctx.json({ booking: serializeBooking(b as any, ctx.user) });
  },
  { roles: ["satpam", "admin"] },
);
