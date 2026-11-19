import { withApi } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { STATUS_TAHAN_JADWAL, STATUS_LABEL } from "@/lib/rules";

export const GET = withApi(async (ctx) => {
  const url = new URL(ctx.req.url);
  const ruangParam = url.searchParams.get("ruang");
  const dari = url.searchParams.get("dari");
  const sampai = url.searchParams.get("sampai");
  if (!ruangParam || !dari || !sampai)
    throw ERR.INPUT_TIDAK_VALID({
      query: "Parameter ruang, dari, dan sampai wajib diisi.",
    });
  const resourceId = parseInt(ruangParam, 10);
  if (!Number.isFinite(resourceId))
    throw ERR.INPUT_TIDAK_VALID({ ruang: "ID ruang tidak valid." });

  const [bookings, holidays, ruang] = await Promise.all([
    db.booking.findMany({
      where: {
        resourceId,
        tanggal: { gte: dari, lte: sampai },
        status: { in: [...STATUS_TAHAN_JADWAL, "selesai"] },
      },
      include: { pemohon: { include: { unit: true } } },
      orderBy: { tanggal: "asc" },
    }),
    db.holiday.findMany({ where: { tanggal: { gte: dari, lte: sampai } } }),
    db.resource.findUnique({ where: { id: resourceId } }),
  ]);
  if (!ruang) throw ERR.TIDAK_DITEMUKAN("Ruang tidak ditemukan.");

  const role = ctx.user?.roleNama ?? "anon";
  const isOwner = (b: any) => ctx.user?.id === b.pemohonId;
  const showDetail = (b: any) =>
    isOwner(b) || ["kemahasiswaan", "ga", "satpam", "admin"].includes(role);

  return ctx.json({
    ruang: { id: ruang.id, nama: ruang.nama, kode: ruang.kode },
    bookings: bookings.map((b) => ({
      id: b.id,
      kodeBooking: b.kodeBooking,
      tanggal: b.tanggal,
      jamMulai: b.jamMulai,
      jamSelesai: b.jamSelesai,
      status: b.status,
      statusLabel: STATUS_LABEL[b.status] ?? b.status,
      diLuarJamKerja: b.diLuarJamKerja === 1,
      // peminjam lain hanya melihat judul & status
      judul: showDetail(b) || isOwner(b) ? b.judulKegiatan : "Booked",
      judulAsli: showDetail(b) ? b.judulKegiatan : null,
      pemohon: showDetail(b)
        ? { nama: b.pemohon.nama, unit: b.pemohon.unit?.nama ?? null }
        : null,
    })),
    holidays: holidays.map((h) => ({ tanggal: h.tanggal, keterangan: h.keterangan })),
  });
});
