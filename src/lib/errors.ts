// Galat aplikasi standar. Setiap galat membawa kode mesin + pesan ramah + status HTTP.
export class AppError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;

  constructor(
    code: string,
    message: string,
    status: number,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export const ERR = {
  BELUM_MASUK: (msg = "Sesi Anda berakhir. Silakan masuk kembali.") =>
    new AppError("BELUM_MASUK", msg, 401),
  TIDAK_BERWENANG: (msg = "Anda tidak memiliki akses ke halaman ini.") =>
    new AppError("TIDAK_BERWENANG", msg, 403),
  INPUT_TIDAK_VALID: (fields: Record<string, string>) =>
    new AppError("INPUT_TIDAK_VALID", "Periksa kembali isian Anda.", 422, fields),
  TIDAK_DITEMUKAN: (msg = "Data tidak ditemukan.") =>
    new AppError("TIDAK_DITEMUKAN", msg, 404),
  BENTROK_JADWAL: (msg: string) => new AppError("BENTROK_JADWAL", msg, 409),
  STATUS_TIDAK_VALID: (msg: string) => new AppError("STATUS_TIDAK_VALID", msg, 409),
  MINIMAL_HARI_KERJA: (msg: string) =>
    new AppError("MINIMAL_HARI_KERJA", msg, 422),
  KAPASITAS_TERLAMPAUI: (msg: string) =>
    new AppError("KAPASITAS_TERLAMPAUI", msg, 422),
  RUANG_NONAKTIF: (msg = "Ruang ini sedang nonaktif dan tidak dapat dipinjam.") =>
    new AppError("RUANG_NONAKTIF", msg, 422),
  KETENTUAN_BELUM_DISETUJUI: (msg = "Anda harus menyetujui 9 ketentuan pemakaian ruang.") =>
    new AppError("KETENTUAN_BELUM_DISETUJUI", msg, 422),
  CHECKLIST_BELUM_LENGKAP: (msg: string) =>
    new AppError("CHECKLIST_BELUM_LENGKAP", msg, 422),
  KETERANGAN_KERUSAKAN_WAJIB: (msg = "Keterangan kerusakan atau kehilangan wajib diisi.") =>
    new AppError("KETERANGAN_KERUSAKAN_WAJIB", msg, 422),
  PEMBATALAN_TERLALU_MEPET: (msg = "Pembatalan harus dilakukan minimal 1 hari sebelum tanggal penggunaan.") =>
    new AppError("PEMBATALAN_TERLALU_MEPET", msg, 422),
  STATUS_TIDAK_DAPAT_DIBATALKAN: (msg: string) =>
    new AppError("STATUS_TIDAK_DAPAT_DIBATALKAN", msg, 422),
  TAHAP_TIDAK_SESUAI: (msg = "Pengajuan ini tidak menunggu keputusan Anda.") =>
    new AppError("TAHAP_TIDAK_SESUAI", msg, 403),
  ALASAN_WAJIB: (msg = "Tuliskan alasan penolakan agar pemohon dapat memperbaikinya.") =>
    new AppError("ALASAN_WAJIB", msg, 422),
  JAM_TIDAK_VALID: (msg: string) => new AppError("JAM_TIDAK_VALID", msg, 422),
  TANGGAL_TIDAK_VALID: (msg: string) =>
    new AppError("TANGGAL_TIDAK_VALID", msg, 422),
  LOGIN_GAGAL: (msg = "Email atau kata sandi salah.") =>
    new AppError("LOGIN_GAGAL", msg, 401),
  LOGIN_DITAHAN: (msg: string) => new AppError("LOGIN_DITAHAN", msg, 429),
  BERKAS_TIDAK_VALID: (msg: string) =>
    new AppError("BERKAS_TIDAK_VALID", msg, 422),
  KONFLIK: (msg: string) => new AppError("KONFLIK", msg, 409),
};
