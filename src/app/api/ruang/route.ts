import { withApi } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { labelTipe } from "@/lib/serialize";

export const GET = withApi(async (ctx) => {
  const url = new URL(ctx.req.url);
  const tipe = url.searchParams.get("tipe");
  const q = url.searchParams.get("q")?.trim().toLowerCase();

  const where: any = {};
  if (tipe && tipe !== "semua") where.tipe = tipe;
  // non-admin hanya melihat ruang aktif
  if (ctx.user?.roleNama !== "admin") where.isActive = 1;
  if (q) {
    where.OR = [
      { nama: { contains: q } },
      { kode: { contains: q } },
      { gedung: { contains: q } },
    ];
  }

  const rows = await db.resource.findMany({
    where,
    orderBy: [{ tipe: "asc" }, { nama: "asc" }],
    include: {
      facilities: { include: { facility: true } },
    },
  });

  return ctx.json({
    ruang: rows.map((r) => ({
      id: r.id,
      kode: r.kode,
      nama: r.nama,
      tipe: r.tipe,
      tipeLabel: labelTipe(r.tipe),
      gedung: r.gedung,
      lantai: r.lantai,
      kapasitas: r.kapasitas,
      deskripsi: r.deskripsi,
      isActive: r.isActive === 1,
      fasilitas: r.facilities.map((rf) => ({
        facilityId: rf.facilityId,
        nama: rf.facility.nama,
        satuan: rf.facility.satuan,
        jumlah: rf.jumlah,
      })),
    })),
  });
});
