// Data awal ROOMIE. Berjalan sekali saat server start (via instrumentation.ts),
// hanya jika tabel users kosong. Mengikuti PRD Bagian 11.

import { db } from "./db";
import { hashPassword } from "./auth";
import { tambahHariKalender, tanggalHariIniWIB } from "./wib";
import { parseHariKerja, DEFAULT_SETTINGS } from "./rules";

const DEMO_PASSWORD = "Roomie123!";

function kodeBooking(tahun: number, id: number): string {
  return `CWE-FORM-${tahun}-${String(id).padStart(5, "0")}`;
}

async function ensureRoles() {
  const names = ["peminjam", "kemahasiswaan", "ga", "satpam", "admin"];
  for (const n of names) {
    await db.role.upsert({ where: { nama: n }, update: {}, create: { nama: n } });
  }
}

async function ensureUnits() {
  const units = [
    ["Dewan Perwakilan Mahasiswa", "ormawa"],
    ["Teknologi Rekayasa Perangkat Lunak", "prodi"],
    ["Kemahasiswaan", "bagian"],
    ["Umum dan Sarana Prasarana", "bagian"],
    ["Keamanan", "bagian"],
  ] as const;
  for (const [nama, tipe] of units) {
    const existing = await db.unit.findFirst({ where: { nama } });
    if (!existing) await db.unit.create({ data: { nama, tipe } });
  }
}

async function ensureFacilities() {
  const fac = [
    ["Meja", "unit"],
    ["Kursi", "unit"],
    ["LCD Projector / TV", "unit"],
    ["Sound System / Microphone", "set"],
    ["AC / Kipas Angin", "unit"],
    ["Whiteboard & Spidol", "set"],
    ["Laptop / Komputer", "unit"],
    ["Akses Internet / Wi-Fi", "titik"],
    ["Konsumsi (Snack / Makan)", "porsi"],
    ["Lainnya", "-"],
  ] as const;
  for (const [nama, satuan] of fac) {
    await db.facility.upsert({
      where: { nama },
      update: {},
      create: { nama, satuan },
    });
  }
}

async function ensureSettings() {
  const defaults: [string, string][] = [
    ["jam_kerja_mulai", DEFAULT_SETTINGS.jam_kerja_mulai],
    ["jam_kerja_selesai", DEFAULT_SETTINGS.jam_kerja_selesai],
    ["min_hari_kerja_pengajuan", String(DEFAULT_SETTINGS.min_hari_kerja_pengajuan)],
    ["min_hari_pembatalan", String(DEFAULT_SETTINGS.min_hari_pembatalan)],
    ["hari_kerja", DEFAULT_SETTINGS.hari_kerja],
  ];
  for (const [k, v] of defaults) {
    await db.setting.upsert({ where: { kunci: k }, update: {}, create: { kunci: k, nilai: v } });
  }
}

async function ensureHolidays() {
  const lib: [string, string][] = [
    ["2026-12-25", "Hari Raya Natal"],
    ["2027-01-01", "Tahun Baru Masehi"],
  ];
  for (const [tanggal, keterangan] of lib) {
    await db.holiday.upsert({ where: { tanggal }, update: { keterangan }, create: { tanggal, keterangan } });
  }
}

async function ensureResources() {
  const facMap = async () => {
    const all = await db.facility.findMany();
    return new Map(all.map((f) => [f.nama, f.id]));
  };
  const fm = await facMap();

  const resources = [
    {
      kode: "R-7.3",
      nama: "Ruang Kelas 7.3",
      tipe: "ruang_kelas",
      gedung: "Gedung 2",
      lantai: "7",
      kapasitas: 40,
      deskripsi: "Ruang kelas standar dengan proyektor dan papan tulis.",
      fasilitas: [
        ["Meja", 20],
        ["Kursi", 40],
        ["LCD Projector / TV", 1],
        ["AC / Kipas Angin", 2],
        ["Whiteboard & Spidol", 1],
        ["Akses Internet / Wi-Fi", 1],
      ] as const,
    },
    {
      kode: "R-7.4",
      nama: "Ruang Kelas 7.4",
      tipe: "ruang_kelas",
      gedung: "Gedung 2",
      lantai: "7",
      kapasitas: 40,
      deskripsi: "Ruang kelas standar dekat tangga.",
      fasilitas: [
        ["Meja", 20],
        ["Kursi", 40],
        ["LCD Projector / TV", 1],
        ["AC / Kipas Angin", 2],
        ["Whiteboard & Spidol", 1],
        ["Akses Internet / Wi-Fi", 1],
      ] as const,
    },
    {
      kode: "RM-01",
      nama: "Ruang Meeting 1",
      tipe: "ruang_meeting",
      gedung: "Gedung 1",
      lantai: "2",
      kapasitas: 15,
      deskripsi: "Ruang rapat kecil dengan layar TV.",
      fasilitas: [
        ["Meja", 1],
        ["Kursi", 15],
        ["LCD Projector / TV", 1],
        ["AC / Kipas Angin", 1],
        ["Akses Internet / Wi-Fi", 1],
      ] as const,
    },
    {
      kode: "AUD-01",
      nama: "Auditorium",
      tipe: "auditorium",
      gedung: "Gedung 1",
      lantai: "1",
      kapasitas: 200,
      deskripsi: "Aula utama untuk seminar dan acara besar.",
      fasilitas: [
        ["Kursi", 200],
        ["LCD Projector / TV", 1],
        ["Sound System / Microphone", 1],
        ["AC / Kipas Angin", 6],
        ["Akses Internet / Wi-Fi", 1],
      ] as const,
    },
    {
      kode: "LP-01",
      nama: "Lapangan Serbaguna",
      tipe: "lapangan",
      gedung: null,
      lantai: null,
      kapasitas: 100,
      deskripsi: "Lapangan terbuka untuk olahraga dan acara mahasiswa.",
      fasilitas: [["Sound System / Microphone", 1]] as const,
    },
    {
      kode: "AR-LIFT2",
      nama: "Area Depan Lift Gedung Dua",
      tipe: "area_lainnya",
      gedung: "Gedung 2",
      lantai: null,
      kapasitas: 50,
      deskripsi: "Area umum di depan lift, cocok untuk pameran kecil.",
      fasilitas: [
        ["Meja", 4],
        ["Kursi", 50],
      ] as const,
    },
  ];

  for (const r of resources) {
    const existing = await db.resource.findUnique({ where: { kode: r.kode } });
    let rid: number;
    if (!existing) {
      const created = await db.resource.create({
        data: {
          kode: r.kode,
          nama: r.nama,
          tipe: r.tipe,
          gedung: r.gedung,
          lantai: r.lantai,
          kapasitas: r.kapasitas,
          deskripsi: r.deskripsi,
          isActive: 1,
        },
      });
      rid = created.id;
    } else {
      rid = existing.id;
    }
    // fasilitas ruang
    for (const [nama, jumlah] of r.fasilitas) {
      const fid = fm.get(nama);
      if (!fid) continue;
      await db.resourceFacility.upsert({
        where: { resourceId_facilityId: { resourceId: rid, facilityId: fid } },
        update: { jumlah },
        create: { resourceId: rid, facilityId: fid, jumlah },
      });
    }
  }
}

async function ensureUsers() {
  const roleMap = new Map((await db.role.findMany()).map((r) => [r.nama, r.id]));
  const unitMap = new Map(
    (await db.unit.findMany()).map((u) => [u.nama, u.id]),
  );

  const users = [
    ["mahasiswa@roomie.test", "peminjam", "Rani Putri", "202500001", "Dewan Perwakilan Mahasiswa", "Ketua DPM"],
    ["kemahasiswaan@roomie.test", "kemahasiswaan", "Bu Sari", "199800002", "Kemahasiswaan", "Kabag Kemahasiswaan"],
    ["ga@roomie.test", "ga", "Pak Budi", "199700003", "Umum dan Sarana Prasarana", "Kabag Umum"],
    ["satpam@roomie.test", "satpam", "Pak Dimas", "199600004", "Keamanan", "Satpam"],
    ["admin@roomie.test", "admin", "Admin ROOMIE", "199600005", "Keamanan", "Administrator"],
  ] as const;

  const ids: Record<string, number> = {};
  for (const [email, role, nama, nimNip, unit, jabatan] of users) {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    const u = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        nama,
        nimNip,
        noHp: "0812-0000-0000",
        jabatan,
        passwordHash,
        roleId: roleMap.get(role as string)!,
        unitId: unitMap.get(unit as string) ?? null,
        isActive: 1,
      },
    });
    ids[email] = u.id;
  }
  return ids;
}

function tambahHariKerja(tanggal: string, n: number, libur: Set<string>, hariKerja: number[]): string {
  let cur = tambahHariKalender(tanggal, 1);
  let added = 0;
  let guard = 0;
  while (added < n && guard < 400) {
    guard++;
    const js = new Date(cur + "T12:00:00+07:00").getUTCDay();
    const dow = js === 0 ? 7 : js;
    if (hariKerja.includes(dow) && !libur.has(cur)) {
      added++;
      if (added === n) return cur;
    }
    cur = tambahHariKalender(cur, 1);
  }
  return cur;
}

async function ensureBookings(userIds: Record<string, number>) {
  const rani = userIds["mahasiswa@roomie.test"];
  const sari = userIds["kemahasiswaan@roomie.test"];
  const budi = userIds["ga@roomie.test"];
  const dimas = userIds["satpam@roomie.test"];
  if (!rani) return;

  const anyBooking = await db.booking.findFirst();
  if (anyBooking) return; // sudah ada booking demo

  const resMap = new Map((await db.resource.findMany()).map((r) => [r.kode, r.id]));
  const liburRows = await db.holiday.findMany();
  const libur = new Set(liburRows.map((l) => l.tanggal));
  const hariKerja = parseHariKerja(DEFAULT_SETTINGS.hari_kerja);
  const hariIni = tanggalHariIniWIB();

  const dPlus5 = tambahHariKerja(hariIni, 5, libur, hariKerja);
  const dPlus7 = tambahHariKerja(hariIni, 7, libur, hariKerja);
  const dPlus3 = tambahHariKerja(hariIni, 3, libur, hariKerja);
  const dPlus4 = tambahHariKerja(hariIni, 4, libur, hariKerja);
  const dKemarin = tambahHariKalender(hariIni, -1);
  const dBulanLalu = tambahHariKalender(hariIni, -30);

  async function buatBooking(opts: {
    resourceId: number;
    judul: string;
    jenis: string;
    peserta: number;
    pj: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    status: string;
    diLuarJamKerja?: boolean;
    alasanPembatalan?: string | null;
    tahap1: "menunggu" | "disetujui" | "ditolak";
    tahap2: "menunggu" | "disetujui" | "ditolak";
    alasanTahap1?: string | null;
    usageLog?: any;
  }) {
    const tahun = parseInt(opts.tanggal.slice(0, 4), 10) || new Date().getFullYear();
    const created = await db.booking.create({
      data: {
        pemohonId: rani,
        resourceId: opts.resourceId,
        judulKegiatan: opts.judul,
        jenisKegiatan: opts.jenis,
        jumlahPeserta: opts.peserta,
        penanggungJawab: opts.pj,
        tanggal: opts.tanggal,
        jamMulai: opts.jamMulai,
        jamSelesai: opts.jamSelesai,
        sifatPenggunaan: "sekali_pakai",
        diLuarJamKerja: opts.diLuarJamKerja ? 1 : 0,
        ketentuanDisetujuiAt: new Date(),
        catatanPemohon: null,
        status: opts.status,
        alasanPembatalan: opts.alasanPembatalan ?? null,
      },
    });
    const kode = kodeBooking(tahun, created.id);
    await db.booking.update({ where: { id: created.id }, data: { kodeBooking: kode } });

    await db.bookingApproval.create({
      data: {
        bookingId: created.id,
        tahap: 1,
        keputusan: opts.tahap1,
        approverId: opts.tahap1 !== "menunggu" ? sari : null,
        alasan: opts.alasanTahap1 ?? null,
        decidedAt: opts.tahap1 !== "menunggu" ? new Date(Date.now() - 1000 * 60 * 60 * 2) : null,
      },
    });
    await db.bookingApproval.create({
      data: {
        bookingId: created.id,
        tahap: 2,
        keputusan: opts.tahap2,
        approverId: opts.tahap2 !== "menunggu" ? budi : null,
        decidedAt: opts.tahap2 !== "menunggu" ? new Date(Date.now() - 1000 * 60 * 60 * 1) : null,
      },
    });

    if (opts.usageLog) {
      await db.usageLog.create({
        data: {
          bookingId: created.id,
          petugasId: dimas,
          ...opts.usageLog,
        },
      });
    }
    return created;
  }

  // 1. menunggu_kemahasiswaan
  await buatBooking({
    resourceId: resMap.get("R-7.3")!,
    judul: "Rapat DPM Bulanan",
    jenis: "rapat_internal",
    peserta: 12,
    pj: "Rani Putri",
    tanggal: dPlus5,
    jamMulai: "13:00",
    jamSelesai: "15:00",
    status: "menunggu_kemahasiswaan",
    tahap1: "menunggu",
    tahap2: "menunggu",
  });

  // 2. menunggu_ga
  await buatBooking({
    resourceId: resMap.get("AUD-01")!,
    judul: "Seminar Pengembangan Diri",
    jenis: "seminar_workshop",
    peserta: 150,
    pj: "Rani Putri",
    tanggal: dPlus7,
    jamMulai: "09:00",
    jamSelesai: "12:00",
    status: "menunggu_ga",
    tahap1: "disetujui",
    tahap2: "menunggu",
  });

  // 3. disetujui (akan datang)
  await buatBooking({
    resourceId: resMap.get("LP-01")!,
    judul: "Latihan UKM Tari",
    jenis: "kegiatan_kemahasiswaan",
    peserta: 30,
    pj: "Rani Putri",
    tanggal: dPlus3,
    jamMulai: "15:00",
    jamSelesai: "17:00",
    status: "disetujui",
    tahap1: "disetujui",
    tahap2: "disetujui",
  });

  // 4. disetujui untuk HARI INI (agar Satpam tidak kosong)
  await buatBooking({
    resourceId: resMap.get("RM-01")!,
    judul: "Rapat Panitia Dies Natalis",
    jenis: "rapat_internal",
    peserta: 10,
    pj: "Rani Putri",
    tanggal: hariIni,
    jamMulai: "10:00",
    jamSelesai: "12:00",
    status: "disetujui",
    tahap1: "disetujui",
    tahap2: "disetujui",
  });

  // 5. ditolak
  await buatBooking({
    resourceId: resMap.get("R-7.4")!,
    judul: "Belajar Kelompok Pemrograman",
    jenis: "perkuliahan",
    peserta: 8,
    pj: "Rani Putri",
    tanggal: dPlus4,
    jamMulai: "09:00",
    jamSelesai: "11:00",
    status: "ditolak",
    tahap1: "ditolak",
    tahap2: "menunggu",
    alasanTahap1: "Jadwal bertabrakan dengan ujian.",
  });

  // 6. selesai kemarin, kondisi baik
  await buatBooking({
    resourceId: resMap.get("R-7.4")!,
    judul: "Kelas Pengganti Basis Data",
    jenis: "perkuliahan",
    peserta: 35,
    pj: "Rani Putri",
    tanggal: dKemarin,
    jamMulai: "09:00",
    jamSelesai: "11:00",
    status: "selesai",
    tahap1: "disetujui",
    tahap2: "disetujui",
    usageLog: {
      checkInAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
      checkOutAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      kondisi: "baik",
      catatanKerusakan: null,
      kunciDikembalikan: 1,
      perangkatDimatikan: 1,
      catatanPetugas: "Ruang bersih dan tertib.",
    },
  });

  // 7. selesai bulan lalu, kondisi ada_kerusakan
  await buatBooking({
    resourceId: resMap.get("RM-01")!,
    judul: "Rapat Koordinasi Prodi",
    jenis: "rapat_internal",
    peserta: 12,
    pj: "Rani Putri",
    tanggal: dBulanLalu,
    jamMulai: "13:00",
    jamSelesai: "15:00",
    status: "selesai",
    tahap1: "disetujui",
    tahap2: "disetujui",
    usageLog: {
      checkInAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 - 1000 * 60 * 60 * 2),
      checkOutAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      kondisi: "ada_kerusakan",
      catatanKerusakan: "Kabel proyektor putus",
      kunciDikembalikan: 1,
      perangkatDimatikan: 1,
      catatanPetugas: "Perlu perbaikan proyektor.",
    },
  });
}

let seedPromise: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const userCount = await db.user.count();
        if (userCount === 0) {
          await ensureRoles();
          await ensureUnits();
          await ensureFacilities();
          await ensureSettings();
          await ensureHolidays();
          await ensureResources();
          const ids = await ensureUsers();
          await ensureBookings(ids);
          console.log("[seed] Data demo ROOMIE berhasil dimuat.");
        } else {
          // pastikan roles/settings/fasilitas/libur ada (untuk skema baru)
          await ensureRoles();
          await ensureSettings();
          await ensureHolidays();
          await ensureFacilities();
        }
      } catch (e) {
        seedPromise = null;
        console.error("[seed] Gagal memuat data demo:", e);
        throw e;
      }
    })();
  }
  return seedPromise;
}

export { DEMO_PASSWORD };
