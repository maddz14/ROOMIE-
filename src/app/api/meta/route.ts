import { withApi } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { loadSettings } from "@/lib/settings";
import { JENIS_KEGIATAN, TIPE_RUANG, KETENTUAN_LIST } from "@/lib/rules";

export const GET = withApi(async (ctx) => {
  const [units, facilities, holidays] = await Promise.all([
    db.unit.findMany({ orderBy: { nama: "asc" } }),
    db.facility.findMany({ orderBy: { nama: "asc" } }),
    db.holiday.findMany({ orderBy: { tanggal: "asc" } }),
  ]);
  const settings = await loadSettings();
  return ctx.json({
    units: units.map((u) => ({ id: u.id, nama: u.nama, tipe: u.tipe })),
    facilities: facilities.map((f) => ({ id: f.id, nama: f.nama, satuan: f.satuan })),
    holidays: holidays.map((h) => ({ tanggal: h.tanggal, keterangan: h.keterangan })),
    jenisKegiatan: JENIS_KEGIATAN,
    tipeRuang: TIPE_RUANG,
    ketentuan: KETENTUAN_LIST,
    settings,
    demoMode: true,
  });
}, { public: true });
