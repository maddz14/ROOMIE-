// Serialisasi entitas ke respons JSON, menyembunyikan data pribadi
// sesuai PRD Bagian 12 (nomor HP/email hanya untuk peran berwenang).

import type { SessionUser } from "./auth";
import { STATUS_LABEL, JENIS_KEGIATAN, TIPE_RUANG } from "./rules";
import { formatWaktu, formatTanggalPendek } from "./wib";

type BookingRow = {
  id: number;
  kodeBooking: string | null;
  pemohonId: number;
  pemohon?: { id: number; nama: string; nimNip: string; email: string; noHp: string | null; jabatan: string | null; unit?: { nama: string } | null };
  resourceId: number;
  resource?: { id: number; nama: string; kode: string; tipe: string; gedung: string | null; lantai: string | null; kapasitas: number; deskripsi: string | null };
  judulKegiatan: string;
  jenisKegiatan: string;
  jumlahPeserta: number;
  penanggungJawab: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  sifatPenggunaan: string;
  diLuarJamKerja: number;
  status: string;
  catatanPemohon: string | null;
  alasanPembatalan: string | null;
  createdAt: Date;
  updatedAt: Date;
  approvals?: any[];
  facilities?: any[];
  documents?: any[];
  usageLog?: any | null;
};

const BOLEH_LIHAT_KONTAK = (role: string) =>
  ["satpam", "kemahasiswaan", "ga", "admin"].includes(role);

export function labelJenis(v: string): string {
  return JENIS_KEGIATAN.find((j) => j.value === v)?.label ?? v;
}
export function labelTipe(v: string): string {
  return TIPE_RUANG.find((t) => t.value === v)?.label ?? v;
}

export function serializeBooking(
  b: BookingRow,
  viewer: SessionUser | null,
): Record<string, unknown> {
  const role = viewer?.roleNama ?? "anon";
  const isOwner = !!viewer && viewer.id === b.pemohonId;
  const bolehKontak = isOwner || BOLEH_LIHAT_KONTAK(role);

  const pemohon: Record<string, unknown> = b.pemohon
    ? {
        id: b.pemohon.id,
        nama: b.pemohon.nama,
        nimNip: isOwner || BOLEH_LIHAT_KONTAK(role) ? b.pemohon.nimNip : null,
        email: bolehKontak ? b.pemohon.email : null,
        noHp: bolehKontak ? b.pemohon.noHp : null,
        jabatan: b.pemohon.jabatan,
        unit: b.pemohon.unit?.nama ?? null,
      }
    : { id: b.pemohonId };

  return {
    id: b.id,
    kodeBooking: b.kodeBooking,
    pemohon,
    resource: b.resource
      ? {
          id: b.resource.id,
          nama: b.resource.nama,
          kode: b.resource.kode,
          tipe: b.resource.tipe,
          tipeLabel: labelTipe(b.resource.tipe),
          gedung: b.resource.gedung,
          lantai: b.resource.lantai,
          kapasitas: b.resource.kapasitas,
          deskripsi: b.resource.deskripsi,
        }
      : { id: b.resourceId },
    judulKegiatan: b.judulKegiatan,
    jenisKegiatan: b.jenisKegiatan,
    jenisLabel: labelJenis(b.jenisKegiatan),
    jumlahPeserta: b.jumlahPeserta,
    penanggungJawab: b.penanggungJawab,
    tanggal: b.tanggal,
    tanggalLabel: formatTanggalPendek(b.tanggal),
    jamMulai: b.jamMulai,
    jamSelesai: b.jamSelesai,
    sifatPenggunaan: b.sifatPenggunaan,
    diLuarJamKerja: b.diLuarJamKerja === 1,
    status: b.status,
    statusLabel: STATUS_LABEL[b.status] ?? b.status,
    catatanPemohon: b.catatanPemohon,
    alasanPembatalan: b.alasanPembatalan,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    approvals: (b.approvals ?? []).map((a: any) => ({
      tahap: a.tahap,
      keputusan: a.keputusan,
      alasan: a.alasan,
      decidedAt: a.decidedAt ? formatWaktu(a.decidedAt) : null,
      approver: a.approver ? { id: a.approver.id, nama: a.approver.nama } : null,
    })),
    facilities: (b.facilities ?? []).map((f: any) => ({
      facilityId: f.facilityId,
      nama: f.facility?.nama ?? null,
      satuan: f.facility?.satuan ?? null,
      jumlah: f.jumlah,
      keterangan: f.keterangan,
    })),
    documents: (b.documents ?? []).map((d: any) => ({
      id: d.id,
      namaFile: d.namaFile,
      uploadedAt: formatWaktu(d.uploadedAt),
    })),
    usageLog: b.usageLog
      ? {
          checkInAt: b.usageLog.checkInAt ? formatWaktu(b.usageLog.checkInAt) : null,
          checkOutAt: b.usageLog.checkOutAt ? formatWaktu(b.usageLog.checkOutAt) : null,
          kondisi: b.usageLog.kondisi,
          catatanKerusakan: b.usageLog.catatanKerusakan,
          kunciDikembalikan: b.usageLog.kunciDikembalikan === 1,
          perangkatDimatikan: b.usageLog.perangkatDimatikan === 1,
          catatanPetugas: b.usageLog.catatanPetugas,
          petugas: b.usageLog.petugas ? { nama: b.usageLog.petugas.nama } : null,
        }
      : null,
  };
}

/** Hitung apakah booking bisa dibatalkan oleh pemohon (BR-07). */
export function bisaDibatalkan(
  status: string,
  tanggal: string,
  hariIni: string,
): { bisa: boolean; alasan?: string } {
  const statusBoleh = ["menunggu_kemahasiswaan", "menunggu_ga", "disetujui"];
  if (!statusBoleh.includes(status)) {
    return {
      bisa: false,
      alasan: "Pengajuan dengan status ini tidak dapat dibatalkan.",
    };
  }
  if (tanggal <= hariIni) {
    return {
      bisa: false,
      alasan: "Pembatalan harus dilakukan minimal 1 hari sebelum tanggal penggunaan.",
    };
  }
  return { bisa: true };
}
