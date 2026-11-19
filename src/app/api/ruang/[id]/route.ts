import { withApi } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { labelTipe } from "@/lib/serialize";

export const GET = withApi(async (ctx) => {
  const id = parseInt(ctx.params.id, 10);
  if (!Number.isFinite(id)) return ctx.json({ ruang: null }, 404);
  const r = await db.resource.findUnique({
    where: { id },
    include: { facilities: { include: { facility: true } } },
  });
  if (!r) return ctx.json({ ruang: null }, 404);
  if (r.isActive !== 1 && ctx.user?.roleNama !== "admin") {
    return ctx.json({ ruang: null }, 404);
  }
  return ctx.json({
    ruang: {
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
    },
  });
});
