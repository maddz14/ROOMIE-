import { withApi } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { serializeBooking, bisaDibatalkan } from "@/lib/serialize";
import { tanggalHariIniWIB } from "@/lib/wib";

export const GET = withApi(async (ctx) => {
  const id = parseInt(ctx.params.id, 10);
  if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();

  const b = await db.booking.findUnique({
    where: { id },
    include: {
      resource: true,
      pemohon: { include: { unit: true } },
      approvals: { include: { approver: true }, orderBy: { tahap: "asc" } },
      facilities: { include: { facility: true } },
      documents: true,
      usageLog: { include: { petugas: true } },
    },
  });
  if (!b) throw ERR.TIDAK_DITEMUKAN("Pengajuan tidak ditemukan.");

  const role = ctx.user!.roleNama;
  const isOwner = b.pemohonId === ctx.user!.id;
  const bolehLihat =
    isOwner ||
    role === "kemahasiswaan" ||
    role === "ga" ||
    role === "satpam" ||
    role === "admin";
  if (!bolehLihat) throw ERR.TIDAK_BERWENANG();

  const s = serializeBooking(b as any, ctx.user);
  const bisa = bisaDibatalkan(b.status, b.tanggal, tanggalHariIniWIB());
  return ctx.json({
    booking: {
      ...s,
      bisaDibatalkan: bisa.bisa,
      alasanTidakBisaDibatalkan: bisa.alasan ?? null,
    },
  });
});
