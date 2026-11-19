// Aturan bisnis murni (tanpa akses DB) — mengikuti PRD Bagian 5 & 12.
// Fungsi di sini boleh diuji terpisah.

import { tambahHariKalender, hariMingguISO } from "./wib";

export const DEFAULT_SETTINGS = {
  jam_kerja_mulai: "08:00",
  jam_kerja_selesai: "17:00",
  min_hari_kerja_pengajuan: 2,
  min_hari_pembatalan: 1,
  hari_kerja: "1,2,3,4,5", // 1=Senin..5=Jumat
};

export type Settings = {
  jam_kerja_mulai: string;
  jam_kerja_selesai: string;
  min_hari_kerja_pengajuan: number;
  min_hari_pembatalan: number;
  hari_kerja: string; // CSV 1..7
};

export function parseHariKerja(csv: string): number[] {
  return csv
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n));
}

/** Rentang slot waktu [mulai, selesai] HH:MM. */
export type Slot = { mulai: string; selesai: string };

/** Apakah dua slot beririsan? (BR-02) 10:00–12:00 & 12:00–14:00 TIDAK bentrok. */
export function adaIrisan(a: Slot, b: Slot): boolean {
  return a.mulai < b.selesai && a.selesai > b.mulai;
}

/** Hitung jumlah hari kerja dalam rentang (dari, sampai] — yaitu mulai besok hingga tanggal tujuan.
 *  Melewati akhir pekan dan hari libur. */
export function hitungHariKerja(
  dari: string,
  sampai: string,
  libur: Set<string>,
  hariKerja: number[],
): number {
  if (sampai <= dari) return 0;
  let count = 0;
  let cur = tambahHariKalender(dari, 1); // mulai besok
  while (cur <= sampai) {
    if (hariKerja.includes(hariMingguISO(cur)) && !libur.has(cur)) count++;
    cur = tambahHariKalender(cur, 1);
  }
  return count;
}

/** Tambahkan n hari kerja (melewati akhir pekan & libur). Untuk menghitung tanggal paling cepat. */
export function tambahHariKerja(
  tanggal: string,
  n: number,
  libur: Set<string>,
  hariKerja: number[],
): string {
  let cur = tambahHariKalender(tanggal, 1);
  let added = 0;
  // batas aman 400 hari untuk mencegah loop tak terhingga
  let guard = 0;
  while (added < n && guard < 400) {
    guard++;
    if (hariKerja.includes(hariMingguISO(cur)) && !libur.has(cur)) {
      added++;
      if (added === n) return cur;
    }
    cur = tambahHariKalender(cur, 1);
  }
  return cur;
}

/** Tanggal paling cepat pengajuan boleh diajukan (hari ini + min_hari_kerja_pengajua hari kerja). */
export function tanggalPalingCepat(
  hariIni: string,
  settings: Settings,
  libur: Set<string>,
): string {
  const hariKerja = parseHariKerja(settings.hari_kerja);
  return tambahHariKerja(
    hariIni,
    settings.min_hari_kerja_pengajuan,
    libur,
    hariKerja,
  );
}

/** Apakah tanggal/jam jatuh di luar jam kerja? (BR-03) */
export function diLuarJamKerja(
  tanggal: string,
  mulai: string,
  selesai: string,
  settings: Settings,
  libur: Set<string>,
): boolean {
  const hariKerja = parseHariKerja(settings.hari_kerja);
  if (!hariKerja.includes(hariMingguISO(tanggal))) return true; // akhir pekan
  if (libur.has(tanggal)) return true; // hari libur
  if (mulai < settings.jam_kerja_mulai) return true;
  if (selesai > settings.jam_kerja_selesai) return true;
  return false;
}

/** Validasi jam (BR-13): selesai > mulai, durasi minimal 30 menit, kelipatan 15 menit. */
export function validasiJam(
  mulai: string,
  selesai: string,
): { ok: boolean; pesan?: string } {
  if (!/^\d{2}:\d{2}$/.test(mulai) || !/^\d{2}:\d{2}$/.test(selesai)) {
    return { ok: false, pesan: "Format jam tidak valid (HH:MM)." };
  }
  if (selesai <= mulai) {
    return { ok: false, pesan: "Jam selesai harus setelah jam mulai." };
  }
  const [mh, mm] = mulai.split(":").map(Number);
  const [sh, sm] = selesai.split(":").map(Number);
  if (mm % 15 !== 0 || sm % 15 !== 0) {
    return { ok: false, pesan: "Jam harus kelipatan 15 menit." };
  }
  const dur = (sh * 60 + sm) - (mh * 60 + mm);
  if (dur < 30) {
    return { ok: false, pesan: "Durasi minimal 30 menit." };
  }
  return { ok: true };
}

/** Saran slot kosong terdekat berikutnya (sederhana): cari kelipatan 30 menit setelah bentrok. */
export function saranSlotSetelah(selesaiBentrok: string): Slot {
  // bulatkan ke atas ke kelipatan 30 menit
  const [h, m] = selesaiBentrok.split(":").map(Number);
  let total = h * 60 + m;
  const rem = total % 30;
  if (rem !== 0) total += 30 - rem;
  const mulai = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  total += 60;
  const selesai = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  return { mulai, selesai };
}

export const JENIS_KEGIATAN: { value: string; label: string }[] = [
  { value: "perkuliahan", label: "Perkuliahan / KBM" },
  { value: "ujian", label: "Ujian" },
  { value: "rapat_internal", label: "Rapat / Meeting Internal" },
  { value: "seminar_workshop", label: "Seminar / Workshop / Pelatihan" },
  { value: "kegiatan_kemahasiswaan", label: "Kegiatan Kemahasiswaan / UKM" },
  { value: "tamu_eksternal", label: "Tamu / Kunjungan Eksternal" },
  { value: "lainnya", label: "Lainnya" },
];

export const TIPE_RUANG: { value: string; label: string }[] = [
  { value: "ruang_kelas", label: "Ruang Kelas" },
  { value: "ruang_meeting", label: "Ruang Meeting" },
  { value: "auditorium", label: "Auditorium" },
  { value: "lapangan", label: "Lapangan" },
  { value: "area_lainnya", label: "Area Lain" },
];

export const STATUS_LABEL: Record<string, string> = {
  menunggu_kemahasiswaan: "Menunggu Kemahasiswaan",
  menunggu_ga: "Menunggu GA",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dibatalkan: "Dibatalkan",
  berlangsung: "Sedang Berlangsung",
  selesai: "Selesai",
};

export const STATUS_TAHAN_JADWAL = [
  "menunggu_kemahasiswaan",
  "menunggu_ga",
  "disetujui",
  "berlangsung",
];

/** 9 ketentuan penggunaan ruang (PRD 9.5). */
export const KETENTUAN_LIST: string[] = [
  "Pemohon wajib mengajukan formulir minimal 2 (dua) hari kerja sebelum tanggal penggunaan.",
  "Penggunaan ruang harus sesuai dengan jadwal dan jenis kegiatan yang disetujui.",
  "Pemohon bertanggung jawab atas kebersihan, kerapian, dan kondisi ruang serta fasilitas selama penggunaan.",
  "Segala bentuk kerusakan fasilitas akibat kelalaian menjadi tanggung jawab penuh pemohon/penanggung jawab kegiatan.",
  "Penggunaan ruang di luar jam kerja wajib mendapat persetujuan tertulis dari Kabag Umum/Sarpras.",
  "Dilarang memindahkan atau mengubah tata letak ruang tanpa izin.",
  "Pemohon wajib mematikan proyektor dan AC setelah acara selesai.",
  "Pemohon wajib mengembalikan kunci dan menyerahkan ruang dalam kondisi semula setelah kegiatan selesai.",
  "Pembatalan peminjaman harus disampaikan minimal 1 (satu) hari sebelumnya.",
];
