import { withApi } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export const GET = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
    const b = await db.booking.findUnique({
      where: { id },
      select: { kodeBooking: true, pemohonId: true, status: true },
    });
    if (!b) throw ERR.TIDAK_DITEMUKAN();
    const role = ctx.user!.roleNama;
    if (ctx.user!.id !== b.pemohonId && role !== "satpam" && role !== "admin")
      throw ERR.TIDAK_BERWENANG();
    if (!b.kodeBooking) throw ERR.TIDAK_DITEMUKAN("Kode booking belum dibuat.");

    const svg = await QRCode.toString(b.kodeBooking, {
      type: "svg",
      margin: 1,
      width: 200,
      color: { dark: "#0F4C5C", light: "#ffffff" },
    });
    return new Response(svg, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
    });
  },
  { roles: ["peminjam", "satpam", "admin"] },
);
