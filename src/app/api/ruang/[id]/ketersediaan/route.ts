import { withApi } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { loadSettings, loadLibur } from "@/lib/settings";
import {
  adaIrisan,
  diLuarJamKerja,
  tanggalPalingCepat,
  validasiJam,
  saranSlotSetelah,
  STATUS_TAHAN_JADWAL,
} from "@/lib/rules";
import { tanggalHariIniWIB } from "@/lib/wib";

export const GET = withApi(async (ctx) => {
  const id = parseInt(ctx.params.id, 10);
  if (!Number.isFinite(id)) throw ERR.INPUT_TIDAK_VALID({ id: "ID ruang tidak valid." });
  const url = new URL(ctx.req.url);
  const tanggal = url.searchParams.get("tanggal");
  const mulai = url.searchParams.get("mulai");
  const selesai = url.searchParams.get("selesai");
  if (!tanggal || !mulai || !selesai)
    throw ERR.INPUT_TIDAK_VALID({
      query: "Parameter tanggal, mulai, dan selesai wajib diisi.",
    });

  const ruang = await db.resource.findUnique({ where: { id } });
  if (!ruang) throw ERR.TIDAK_DITEMUKAN("Ruang tidak ditemukan.");
  if (ruang.isActive !== 1 && ctx.user?.roleNama !== "admin")
    throw ERR.RUANG_NONAKTIF();

  const settings = await loadSettings();
  const libur = await loadLibur();
  const hariIni = tanggalHariIniWIB();

  const bentrokRows = await db.booking.findMany({
    where: {
      resourceId: id,
      tanggal,
      status: { in: STATUS_TAHAN_JADWAL },
    },
    select: { jamMulai: true, jamSelesai: true, judulKegiatan: true, status: true },
  });
  const bentrok = bentrokRows.find((b) =>
    adaIrisan(
      { mulai, selesai },
      { mulai: b.jamMulai, selesai: b.jamSelesai },
    ),
  );

  // saran slot kosong terdekat (dalam jam kerja hari yang sama)
  const saran: { mulai: string; selesai: string }[] = [];
  if (bentrok) {
    const s = saranSlotSetelah(bentrok.jamSelesai);
    // pastikan saran masih dalam jam kerja dan tidak bentrok
    let aman = true;
    for (const b of bentrokRows) {
      if (adaIrisan(s, { mulai: b.jamMulai, selesai: b.jamSelesai })) aman = false;
    }
    if (aman && s.selesai <= settings.jam_kerja_selesai) saran.push(s);
  }

  const j = validasiJam(mulai, selesai);
  const luar = diLuarJamKerja(tanggal, mulai, selesai, settings, libur);
  const palingCepat = tanggalPalingCepat(hariIni, settings, libur);

  return ctx.json({
    tersedia: !bentrok && j.ok && tanggal >= palingCepat,
    bentrok: bentrok
      ? {
          judul: bentrok.judulKegiatan,
          mulai: bentrok.jamMulai,
          selesai: bentrok.jamSelesai,
        }
      : null,
    diLuarJamKerja: luar,
    minimalTanggal: palingCepat,
    jamValid: j.ok,
    jamError: j.pesan ?? null,
    saran,
  });
});
