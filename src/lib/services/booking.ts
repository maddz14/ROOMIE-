// Layanan inti peminjaman: ajukan, putuskan, batalkan, check-in, check-out.
// Semua aturan bisnis (PRD Bagian 5) ditegakkan di sini dalam transaksi.

import { db } from "@/lib/db";
import { ERR } from "@/lib/errors";
import { loadSettings, loadLibur } from "@/lib/settings";
import {
  hitungHariKerja,
  parseHariKerja,
  diLuarJamKerja,
  validasiJam,
  adaIrisan,
  tanggalPalingCepat,
  STATUS_TAHAN_JADWAL,
} from "@/lib/rules";
import { tanggalHariIniWIB, nowWIBISO, formatWaktu } from "@/lib/wib";

// ---- Mutex per-resource untuk mencegah race double-booking (T-13) ----
const mutexes = new Map<string, Promise<unknown>>();
async function withMutex<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = mutexes.get(key) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((res) => (release = res));
  mutexes.set(key, prev.then(() => next));
  await prev.catch(() => {});
  try {
    return await fn();
  } finally {
    release();
    if (mutexes.get(key) === next) mutexes.delete(key);
  }
}

function kodeBooking(tahun: number, id: number): string {
  return `CWE-FORM-${tahun}-${String(id).padStart(5, "0")}`;
}

export type AjukanInput = {
  userId: number;
  resourceId: number;
  judulKegiatan: string;
  jenisKegiatan: string;
  jumlahPeserta: number;
  penanggungJawab: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  sifatPenggunaan?: string;
  catatanPemohon?: string;
  fasilitas: { facilityId: number; jumlah: number; keterangan?: string }[];
  setujuKetentuan: boolean;
};

export async function ajukan(input: AjukanInput) {
  return withMutex(`resource:${input.resourceId}`, async () => {
    const settings = await loadSettings();
    const libur = await loadLibur();
    const hariKerja = parseHariKerja(settings.hari_kerja);
    const hariIni = tanggalHariIniWIB();

    // BR-14: tanggal tidak boleh di masa lalu
    if (input.tanggal < hariIni)
      throw ERR.TANGGAL_TIDAK_VALID("Tanggal penggunaan tidak boleh di masa lalu.");

    // BR-13: validasi jam
    const j = validasiJam(input.jamMulai, input.jamSelesai);
    if (!j.ok) throw ERR.JAM_TIDAK_VALID(j.pesan ?? "Jam tidak valid.");

    // BR-11: ruang aktif
    const ruang = await db.resource.findUnique({
      where: { id: input.resourceId },
    });
    if (!ruang) throw ERR.TIDAK_DITEMUKAN("Ruang tidak ditemukan.");
    if (ruang.isActive !== 1) throw ERR.RUANG_NONAKTIF();

    // BR-10: kapasitas
    if (ruang.kapasitas > 0 && input.jumlahPeserta > ruang.kapasitas) {
      throw ERR.KAPASITAS_TERLAMPAUI(
        `Jumlah peserta melebihi kapasitas ruang (${ruang.kapasitas} orang).`,
      );
    }

    // BR-01: minimal hari kerja
    const hk = hitungHariKerja(hariIni, input.tanggal, libur, hariKerja);
    if (hk < settings.min_hari_kerja_pengajuan) {
      const palingCepat = tanggalPalingCepat(hariIni, settings, libur);
      throw ERR.MINIMAL_HARI_KERJA(
        `Pengajuan minimal ${settings.min_hari_kerja_pengajuan} hari kerja sebelum tanggal penggunaan. Tanggal paling cepat: ${palingCepat}.`,
      );
    }

    // BR-04: ketentuan disetujui
    if (!input.setujuKetentuan) throw ERR.KETENTUAN_BELUM_DISETUJUI();

    // BR-03: di luar jam kerja (tetap diterima)
    const luar = diLuarJamKerja(
      input.tanggal,
      input.jamMulai,
      input.jamSelesai,
      settings,
      libur,
    );

    const tahun = parseInt(input.tanggal.slice(0, 4), 10) || new Date().getFullYear();

    return db.$transaction(async (tx) => {
      // BR-02: bentrok (cek dalam transaksi)
      const re = await tx.booking.findMany({
        where: {
          resourceId: input.resourceId,
          tanggal: input.tanggal,
          status: { in: STATUS_TAHAN_JADWAL },
        },
        select: { jamMulai: true, jamSelesai: true, judulKegiatan: true },
      });
      const rb = re.find((b) =>
        adaIrisan(
          { mulai: input.jamMulai, selesai: input.jamSelesai },
          { mulai: b.jamMulai, selesai: b.jamSelesai },
        ),
      );
      if (rb) {
        throw ERR.BENTROK_JADWAL(
          `Ruang ini sudah dipakai pada ${rb.jamMulai}–${rb.jamSelesai} untuk "${rb.judulKegiatan}". Coba jam lain.`,
        );
      }

      const booking = await tx.booking.create({
        data: {
          pemohonId: input.userId,
          resourceId: input.resourceId,
          judulKegiatan: input.judulKegiatan,
          jenisKegiatan: input.jenisKegiatan,
          jumlahPeserta: input.jumlahPeserta,
          penanggungJawab: input.penanggungJawab,
          tanggal: input.tanggal,
          jamMulai: input.jamMulai,
          jamSelesai: input.jamSelesai,
          sifatPenggunaan: input.sifatPenggunaan ?? "sekali_pakai",
          diLuarJamKerja: luar ? 1 : 0,
          ketentuanDisetujuiAt: new Date(),
          catatanPemohon: input.catatanPemohon ?? null,
          status: "menunggu_kemahasiswaan",
        },
      });

      const kode = kodeBooking(tahun, booking.id);
      await tx.booking.update({ where: { id: booking.id }, data: { kodeBooking: kode } });

      // dua baris persetujuan
      await tx.bookingApproval.createMany({
        data: [
          { bookingId: booking.id, tahap: 1, keputusan: "menunggu" },
          { bookingId: booking.id, tahap: 2, keputusan: "menunggu" },
        ],
      });

      // fasilitas
      if (input.fasilitas.length > 0) {
        await tx.bookingFacility.createMany({
          data: input.fasilitas.map((f) => ({
            bookingId: booking.id,
            facilityId: f.facilityId,
            jumlah: f.jumlah,
            keterangan: f.keterangan ?? null,
          })),
        });
      }

      // notifikasi ke semua kemahasiswaan aktif
      const kem = await tx.user.findMany({
        where: { role: { nama: "kemahasiswaan" }, isActive: 1 },
        select: { id: true },
      });
      if (kem.length > 0) {
        await tx.notification.createMany({
          data: kem.map((k) => ({
            userId: k.id,
            bookingId: booking.id,
            judul: "Pengajuan baru",
            pesan: `${kode}: ${input.judulKegiatan} menunggu verifikasi Anda.`,
          })),
        });
      }

      // audit log
      await tx.auditLog.create({
        data: {
          userId: input.userId,
          aksi: "buat_booking",
          tabel: "bookings",
          recordId: booking.id,
          detail: kode,
        },
      });

      return { ...booking, kodeBooking: kode };
    });
  });
}

export async function putuskan(args: {
  bookingId: number;
  approverId: number;
  roleNama: string;
  keputusan: "disetujui" | "ditolak";
  alasan?: string;
}) {
  const tahap = args.roleNama === "kemahasiswaan" ? 1 : args.roleNama === "ga" ? 2 : null;
  if (tahap === null) throw ERR.TIDAK_BERWENANG();

  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: args.bookingId },
      include: { approvals: true, pemohon: true, resource: true },
    });
    if (!booking) throw ERR.TIDAK_DITEMUKAN("Pengajuan tidak ditemukan.");

    const statusDiharapkan =
      tahap === 1 ? "menunggu_kemahasiswaan" : "menunggu_ga";
    if (booking.status !== statusDiharapkan) {
      // BR-08: tahap tidak sesuai
      throw ERR.TAHAP_TIDAK_SESUAI();
    }

    if (args.keputusan === "ditolak") {
      // BR-09: alasan wajib
      if (!args.alasan || args.alasan.trim().length < 5)
        throw ERR.ALASAN_WAJIB();
    }

    const approval = booking.approvals.find((a) => a.tahap === tahap)!;
    await tx.bookingApproval.update({
      where: { id: approval.id },
      data: {
        approverId: args.approverId,
        keputusan: args.keputusan,
        alasan: args.alasan ?? null,
        decidedAt: new Date(),
      },
    });

    let statusBaru: string = booking.status;
    const notifs: { userId: number; judul: string; pesan: string }[] = [];

    if (args.keputusan === "ditolak") {
      statusBaru = "ditolak";
      notifs.push({
        userId: booking.pemohonId,
        judul: "Pengajuan ditolak",
        pesan: `${booking.kodeBooking}: ${args.alasan}`,
      });
    } else {
      // disetujui tahap ini
      if (tahap === 1) {
        statusBaru = "menunggu_ga";
        // notif ke semua GA
        const gas = await tx.user.findMany({
          where: { role: { nama: "ga" }, isActive: 1 },
          select: { id: true },
        });
        for (const g of gas)
          notifs.push({
            userId: g.id,
            judul: "Menunggu persetujuan Anda",
            pesan: `${booking.kodeBooking}: ${booking.judulKegiatan} menunggu keputusan GA.`,
          });
        notifs.push({
          userId: booking.pemohonId,
          judul: "Diteruskan ke GA",
          pesan: `${booking.kodeBooking}: disetujui Kemahasiswaan, menunggu GA.`,
        });
      } else {
        // tahap 2 -> disetujui
        statusBaru = "disetujui";
        notifs.push({
          userId: booking.pemohonId,
          judul: "Pengajuan disetujui",
          pesan: `${booking.kodeBooking}: disetujui. Tunjukkan QR kepada Satpam.`,
        });
        const satpams = await tx.user.findMany({
          where: { role: { nama: "satpam" }, isActive: 1 },
          select: { id: true },
        });
        for (const s of satpams)
          notifs.push({
            userId: s.id,
            judul: "Jadwal baru disetujui",
            pesan: `${booking.kodeBooking}: ${booking.resource.nama}, ${booking.tanggal} ${booking.jamMulai}–${booking.jamSelesai}.`,
          });
      }
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: { status: statusBaru },
    });

    if (notifs.length > 0) {
      await tx.notification.createMany({
        data: notifs.map((n) => ({ ...n, bookingId: booking.id })),
      });
    }

    await tx.auditLog.create({
      data: {
        userId: args.approverId,
        aksi:
          args.keputusan === "disetujui"
            ? `setujui_tahap_${tahap}`
            : `tolak_tahap_${tahap}`,
        tabel: "bookings",
        recordId: booking.id,
        detail: `${booking.status} -> ${statusBaru}`,
      },
    });

    return { id: booking.id, status: statusBaru };
  });
}

export async function batalkan(args: {
  bookingId: number;
  userId: number;
  alasan: string;
}) {
  const hariIni = tanggalHariIniWIB();
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: args.bookingId },
      include: { approvals: true },
    });
    if (!booking) throw ERR.TIDAK_DITEMUKAN("Pengajuan tidak ditemukan.");
    if (booking.pemohonId !== args.userId) throw ERR.TIDAK_BERWENANG();
    const bisa = ["menunggu_kemahasiswaan", "menunggu_ga", "disetujui"];
    if (!bisa.includes(booking.status)) {
      throw ERR.STATUS_TIDAK_DAPAT_DIBATALKAN(
        "Pengajuan dengan status ini tidak dapat dibatalkan.",
      );
    }
    // BR-07: minimal 1 hari kalender sebelum tanggal penggunaan
    if (booking.tanggal <= hariIni) {
      throw ERR.PEMBATALAN_TERLALU_MEPET();
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "dibatalkan", alasanPembatalan: args.alasan },
    });

    // notifikasi ke pemutus yang sedang menunggu + satpam bila sudah disetujui
    const notifs: { userId: number; judul: string; pesan: string }[] = [];
    if (booking.status === "disetujui") {
      const satpams = await tx.user.findMany({
        where: { role: { nama: "satpam" }, isActive: 1 },
        select: { id: true },
      });
      for (const s of satpams)
        notifs.push({
          userId: s.id,
          judul: "Pengajuan dibatalkan",
          pesan: `${booking.kodeBooking} dibatalkan oleh pemohon.`,
        });
    } else {
      const approverRole =
        booking.status === "menunggu_kemahasiswaan" ? "kemahasiswaan" : "ga";
      const approvers = await tx.user.findMany({
        where: { role: { nama: approverRole }, isActive: 1 },
        select: { id: true },
      });
      for (const a of approvers)
        notifs.push({
          userId: a.id,
          judul: "Pengajuan dibatalkan",
          pesan: `${booking.kodeBooking} dibatalkan oleh pemohon.`,
        });
    }
    if (notifs.length > 0) {
      await tx.notification.createMany({
        data: notifs.map((n) => ({ ...n, bookingId: booking.id })),
      });
    }

    await tx.auditLog.create({
      data: {
        userId: args.userId,
        aksi: "batal_booking",
        tabel: "bookings",
        recordId: booking.id,
        detail: `${booking.status} -> dibatalkan`,
      },
    });
    return { id: booking.id, status: "dibatalkan" };
  });
}

export async function checkIn(args: { bookingId: number; petugasId: number }) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: args.bookingId },
      include: { usageLog: true },
    });
    if (!booking) throw ERR.TIDAK_DITEMUKAN("Pengajuan tidak ditemukan.");
    // BR-12
    if (booking.status !== "disetujui")
      throw ERR.STATUS_TIDAK_VALID(
        "Check-in hanya untuk pengajuan berstatus Disetujui.",
      );
    if (booking.usageLog)
      throw ERR.STATUS_TIDAK_VALID("Pengajuan ini sudah di-check-in.");

    const usage = await tx.usageLog.create({
      data: {
        bookingId: booking.id,
        petugasId: args.petugasId,
        checkInAt: new Date(),
      },
    });
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "berlangsung" },
    });
    await tx.notification.create({
      data: {
        userId: booking.pemohonId,
        bookingId: booking.id,
        judul: "Penggunaan ruang dimulai",
        pesan: `${booking.kodeBooking}: Satpam telah melakukan check-in.`,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: args.petugasId,
        aksi: "check_in",
        tabel: "bookings",
        recordId: booking.id,
        detail: "disetujui -> berlangsung",
      },
    });
    return usage;
  });
}

export async function checkOut(args: {
  bookingId: number;
  petugasId: number;
  kondisi: "baik" | "ada_kerusakan";
  catatanKerusakan?: string;
  kunciDikembalikan: boolean;
  perangkatDimatikan: boolean;
  catatanPetugas?: string;
}) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: args.bookingId },
      include: { usageLog: true },
    });
    if (!booking) throw ERR.TIDAK_DITEMUKAN("Pengajuan tidak ditemukan.");
    // BR-12
    if (booking.status !== "berlangsung")
      throw ERR.STATUS_TIDAK_VALID(
        "Check-out hanya untuk pengajuan berstatus Sedang Berlangsung.",
      );

    // BR-05: checklist
    if (!args.kunciDikembalikan || !args.perangkatDimatikan) {
      throw ERR.CHECKLIST_BELUM_LENGKAP(
        "Centang kunci dikembalikan dan perangkat dimatikan sebelum menyelesaikan.",
      );
    }
    // BR-06: keterangan kerusakan wajib bila rusak
    if (
      args.kondisi === "ada_kerusakan" &&
      (!args.catatanKerusakan || args.catatanKerusakan.trim().length < 3)
    ) {
      throw ERR.KETERANGAN_KERUSAKAN_WAJIB();
    }

    await tx.usageLog.update({
      where: { bookingId: booking.id },
      data: {
        checkOutAt: new Date(),
        kondisi: args.kondisi,
        catatanKerusakan: args.catatanKerusakan ?? null,
        kunciDikembalikan: 1,
        perangkatDimatikan: 1,
        catatanPetugas: args.catatanPetugas ?? null,
      },
    });
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "selesai" },
    });

    // notifikasi pemohon (+ GA bila rusak)
    await tx.notification.create({
      data: {
        userId: booking.pemohonId,
        bookingId: booking.id,
        judul: "Penggunaan selesai",
        pesan: `${booking.kodeBooking}: ruang telah dikembalikan. Kondisi: ${args.kondisi === "baik" ? "Baik" : "Ada kerusakan"}.`,
      },
    });
    if (args.kondisi === "ada_kerusakan") {
      const gas = await tx.user.findMany({
        where: { role: { nama: "ga" }, isActive: 1 },
        select: { id: true },
      });
      for (const g of gas) {
        await tx.notification.create({
          data: {
            userId: g.id,
            bookingId: booking.id,
            judul: "Kerusakan tercatat",
            pesan: `${booking.kodeBooking}: ${args.catatanKerusakan}`,
          },
        });
      }
    }
    await tx.auditLog.create({
      data: {
        userId: args.petugasId,
        aksi: "check_out",
        tabel: "bookings",
        recordId: booking.id,
        detail: `berlangsung -> selesai (${args.kondisi})`,
      },
    });
    return { id: booking.id, status: "selesai" };
  });
}

/** Buat notifikasi generik. */
export async function notif(
  userIds: number[],
  judul: string,
  pesan: string,
  bookingId?: number,
) {
  if (userIds.length === 0) return;
  await db.notification.createMany({
    data: userIds.map((u) => ({
      userId: u,
      judul,
      pesan,
      bookingId: bookingId ?? null,
    })),
  });
}

export { kodeBooking, nowWIBISO, formatWaktu };
