# PRD ROOMIE: Aplikasi Web Peminjaman Ruangan dan Lapangan Kampus

Versi 1.0 | 19 November 2026 | Kelompok 3, Pemrograman Database Terapan
Studi kasus: Politeknik Kelapa Sawit Citra Widya Edukasi (formulir CWE-FORM versi 01)

---

## 0. Instruksi untuk GLM (baca dulu)

Bangun aplikasi web **lengkap dan langsung berjalan** dari dokumen ini. Aturan kerja:

1. **Satu perintah untuk menjalankan:** `npm install && npm start`. Server mendengarkan `0.0.0.0:${PORT:-3000}`. Database dibuat, dimigrasi, dan diisi data demo otomatis pada start pertama.
2. **Tanpa layanan eksternal.** Tidak ada MySQL, Redis, email SMTP, atau CDN. Semua aset (CSS, JS, ikon, font sistem) disajikan dari server sendiri supaya jalan di lingkungan tertutup.
3. **Tanpa langkah build.** Frontend berupa HTML, CSS, dan JavaScript biasa (ES modules) yang disajikan Express. Jangan memakai React, Vue, Tailwind, atau bundler.
4. **Tidak ada placeholder.** Dilarang teks "Lorem ipsum", tombol yang tidak berfungsi, halaman kosong "segera hadir", atau data palsu yang tidak berasal dari database. Setiap tombol di dokumen ini harus bekerja.
5. **Semua teks UI berbahasa Indonesia**, singkat dan jelas. Kode, nama variabel, dan komentar boleh bahasa Inggris atau Indonesia, tetapi konsisten.
6. **Aturan bisnis dijaga di server dan di database**, bukan hanya di tampilan (lihat Bagian 5 dan 8).
7. Setelah selesai, **jalankan `npm run smoke`** (Bagian 14) dan perbaiki sampai semua skenario lulus. Laporkan hasilnya apa adanya.
8. Jika sesuatu di dokumen ini ambigu, pilih opsi paling sederhana yang tetap memenuhi aturan bisnis, lalu catat keputusannya di `README.md`, bagian "Keputusan desain".

**Cara memakai di GLM (disarankan, agar keluaran tidak terpotong):**
- Prompt 1: tempel dokumen ini, lalu tulis "Kerjakan Bagian 3 sampai 10 dan 12: backend, database, seed, dan API saja. Uji dengan curl."
- Prompt 2: "Lanjutkan dengan frontend sesuai Bagian 9 dan 11. Semua halaman memakai API yang sudah ada."
- Prompt 3: "Buat `npm run smoke` sesuai Bagian 14, jalankan, dan perbaiki semua kegagalan."

---

## 1. Ringkasan Produk

**ROOMIE** adalah website untuk meminjam ruang kelas, ruang meeting, auditorium, lapangan, dan area kampus lainnya. Ia menggantikan formulir kertas CWE-FORM yang kini harus ditandatangani berurutan oleh beberapa pihak.

**Masalah nyata di formulir kertas:**
- Tidak ada kalender, sehingga jadwal rawan bentrok.
- Pemohon tidak tahu pengajuannya sudah sampai tahap mana.
- Kolom penting sering kosong (judul kegiatan, nomor dokumen, tanggal persetujuan, kondisi ruang setelah dipakai).
- Lokasi di luar daftar ruang ditulis tangan (misalnya "Depan Lift Gedung Dua").
- Tanggal dikoreksi manual tanpa riwayat.
- Rekap penggunaan sulit dibuat.

**Solusi:** pengajuan digital dengan kalender, validasi otomatis, persetujuan dua tahap (Kemahasiswaan lalu GA), check-in dan check-out oleh Satpam, notifikasi, dan laporan.

**Tujuan terukur:**

| Tujuan | Ukuran keberhasilan |
|---|---|
| Tidak ada double booking | 0 bentrok pada semua skenario uji, termasuk dua permintaan bersamaan |
| Pemohon selalu tahu status | Setiap perubahan status menghasilkan notifikasi dan terlihat di halaman detail |
| Pengajuan cepat | Pemohon dapat menyelesaikan pengajuan dalam 4 langkah |
| Data lengkap | Semua kolom wajib divalidasi; tidak ada pengajuan tanpa judul atau penanggung jawab |
| Mudah direkap | Laporan per periode dapat diunduh sebagai CSV |

---

## 2. Pengguna dan Peran

| Peran (`role`) | Siapa | Dapat melakukan |
|---|---|---|
| `peminjam` | Mahasiswa/ormawa, dosen, staf | Lihat ruang dan kalender; ajukan, lacak, batalkan pengajuan sendiri; cetak bukti; notifikasi |
| `kemahasiswaan` | Staf/Kabag Kemahasiswaan | Persetujuan **tahap 1** ("Mengetahui"); lihat laporan |
| `ga` | Kabag Umum / Sarana Prasarana | Persetujuan **tahap 2** ("Menyetujui"); lihat laporan |
| `satpam` | Satpam / Petugas Sarpras | Check-in, check-out, catat kondisi ruang |
| `admin` | Administrator sistem | Kelola ruang, fasilitas, pengguna, hari libur, pengaturan; lihat semua laporan dan audit log |

Pendaftaran mandiri (`/daftar`) hanya membuat akun `peminjam`. Peran lain hanya dibuat atau diubah oleh admin.

**Akun demo** (dibuat oleh seed, kata sandi semuanya `Roomie123!`):

| Email | Peran | Nama |
|---|---|---|
| mahasiswa@roomie.test | peminjam | Rani Putri (Dewan Perwakilan Mahasiswa) |
| kemahasiswaan@roomie.test | kemahasiswaan | Bu Sari (Kabag Kemahasiswaan) |
| ga@roomie.test | ga | Pak Budi (Kabag Umum) |
| satpam@roomie.test | satpam | Pak Dimas (Satpam) |
| admin@roomie.test | admin | Admin ROOMIE |

Halaman login menampilkan panel "Coba dengan akun demo" berisi lima tombol yang mengisi form otomatis. Panel ini hanya tampil jika `DEMO_MODE=true` (default `true`).

---

## 3. Ruang Lingkup

**Masuk (wajib ada):** login dan peran; katalog ruang dan fasilitas; kalender mingguan; formulir pengajuan 4 langkah; validasi bentrok, hari kerja, jam kerja, dan kapasitas; persetujuan 2 tahap dengan alasan penolakan; pembatalan; check-in dan check-out; notifikasi dalam aplikasi; riwayat; bukti cetak dengan QR; laporan dan ekspor CSV; panel admin; audit log.

**Tidak masuk:** aplikasi mobile native; peminjaman berkala otomatis; peminjaman barang terpisah; integrasi SIAKAD; pembayaran; tanda tangan digital tersertifikasi; email dan WhatsApp otomatis.

---

## 4. Alur dan Status

```
Pemohon kirim
   │  (validasi lolos)
   ▼
menunggu_kemahasiswaan ──tolak(+alasan)──► ditolak
   │ setuju
   ▼
menunggu_ga ─────────────tolak(+alasan)──► ditolak
   │ setuju
   ▼
disetujui ──Satpam check-in──► berlangsung ──Satpam check-out──► selesai

Pembatalan oleh pemohon (min. H-1): dari menunggu_kemahasiswaan / menunggu_ga / disetujui ──► dibatalkan
```

- Status yang **menahan jadwal** (dianggap terpakai): `menunggu_kemahasiswaan`, `menunggu_ga`, `disetujui`, `berlangsung`.
- Status `ditolak`, `dibatalkan`, `selesai` melepas atau menutup slot.
- Penolakan di tahap mana pun mengakhiri alur.
- Pengajuan di luar jam kerja tetap melewati dua tahap yang sama, tetapi diberi penanda **"Di luar jam kerja"** agar GA memperhatikannya (ketentuan 5 formulir).

---

## 5. Aturan Bisnis

Semua aturan ini **wajib ditegakkan di server**. Aturan bentrok juga ditegakkan oleh trigger database.

| ID | Aturan | Kode galat | HTTP |
|---|---|---|---|
| BR-01 | Pengajuan minimal **2 hari kerja** sebelum tanggal penggunaan. Hitung jumlah hari kerja pada rentang (tanggal_hari_ini, tanggal_penggunaan], yaitu mulai besok sampai hari penggunaan. Contoh: diajukan Senin untuk Rabu = 2 hari kerja, lolos; untuk Selasa = 1, ditolak. | `MINIMAL_HARI_KERJA` | 422 |
| BR-02 | Jadwal tidak boleh beririsan dengan pengajuan berstatus penahan jadwal pada ruang dan tanggal yang sama. Irisan: `mulai_baru < selesai_lama` **dan** `selesai_baru > mulai_lama`. Jam 10:00–12:00 dan 12:00–14:00 **tidak** bentrok. | `BENTROK_JADWAL` | 409 |
| BR-03 | Jika tanggal jatuh di akhir pekan atau hari libur, atau jam di luar jam kerja (default 08:00–17:00), set `di_luar_jam_kerja = 1`. Tetap diterima. | - | - |
| BR-04 | Pemohon wajib mencentang persetujuan atas 9 ketentuan penggunaan ruang sebelum mengirim. | `KETENTUAN_BELUM_DISETUJUI` | 422 |
| BR-05 | Check-out wajib mencentang "perangkat (proyektor/AC) dimatikan" dan "kunci dikembalikan", serta memilih kondisi ruang. | `CHECKLIST_BELUM_LENGKAP` | 422 |
| BR-06 | Jika kondisi `ada_kerusakan`, keterangan kerusakan/kehilangan wajib diisi. | `KETERANGAN_KERUSAKAN_WAJIB` | 422 |
| BR-07 | Pembatalan hanya oleh pemohon, minimal **1 hari kalender** sebelum tanggal penggunaan, dan hanya dari status `menunggu_kemahasiswaan`, `menunggu_ga`, atau `disetujui`. | `PEMBATALAN_TERLALU_MEPET` / `STATUS_TIDAK_DAPAT_DIBATALKAN` | 422 |
| BR-08 | Tahap 1 hanya boleh oleh peran `kemahasiswaan` pada status `menunggu_kemahasiswaan`. Tahap 2 hanya oleh `ga` pada status `menunggu_ga`. | `TAHAP_TIDAK_SESUAI` | 403 |
| BR-09 | Menolak wajib disertai alasan (minimal 5 karakter). | `ALASAN_WAJIB` | 422 |
| BR-10 | Jumlah peserta tidak boleh melebihi kapasitas ruang (jika kapasitas > 0). | `KAPASITAS_TERLAMPAUI` | 422 |
| BR-11 | Ruang nonaktif tidak dapat dipinjam. | `RUANG_NONAKTIF` | 422 |
| BR-12 | Check-in hanya untuk status `disetujui`; check-out hanya untuk `berlangsung`. | `STATUS_TIDAK_VALID` | 409 |
| BR-13 | Jam selesai harus setelah jam mulai; durasi minimal 30 menit; jam kelipatan 15 menit. | `JAM_TIDAK_VALID` | 422 |
| BR-14 | Tanggal penggunaan tidak boleh di masa lalu. | `TANGGAL_TIDAK_VALID` | 422 |

**Zona waktu:** semua tanggal dan jam dihitung dalam **Asia/Jakarta (WIB)**. Simpan tanggal sebagai teks `YYYY-MM-DD` dan jam sebagai `HH:MM`. Untuk "hari ini", hitung dari WIB dengan `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })`, **jangan** bergantung pada zona waktu server.

**Pengaturan yang dapat diubah admin** (tabel `settings`, nilai default): `jam_kerja_mulai=08:00`, `jam_kerja_selesai=17:00`, `min_hari_kerja_pengajuan=2`, `min_hari_pembatalan=1`, `hari_kerja=1,2,3,4,5` (1 = Senin).

---

## 6. Stack Teknis

| Komponen | Pilihan | Catatan |
|---|---|---|
| Runtime | Node.js 20 atau lebih baru | |
| Server | Express 4 | |
| Database | **SQLite** lewat `better-sqlite3` | Berkas `./data/roomie.db`; `PRAGMA foreign_keys=ON; journal_mode=WAL`. Jika `better-sqlite3` gagal dipasang dan Node ≥ 22.5, boleh pakai `node:sqlite` bawaan dengan API yang setara. |
| Hash kata sandi | `bcryptjs` | Murni JavaScript, tanpa kompilasi native |
| Sesi | Cookie `roomie_sid` (acak 32 byte, `HttpOnly`, `SameSite=Lax`), disimpan di tabel `sessions`, kedaluwarsa 8 jam sejak aktivitas terakhir | |
| QR code | `qrcode` | Dibuat sebagai SVG/data URL di server |
| Unggah dokumen | `multer` | Maks 2 MB; hanya PDF, JPG, PNG; simpan di `./data/uploads` dengan nama acak |
| Frontend | HTML, CSS, JS (ES modules), router hash (`#/...`) | Disajikan dari `public/` |
| Uji | `node:test` dan `fetch` bawaan | Skrip `npm run smoke` |

Alasan memakai SQLite: agar aplikasi **langsung jalan di server GLM tanpa instalasi database**. Skema dan logikanya meniru skema MySQL proyek (`roomie_schema.sql`); aturan bentrok dijaga trigger yang setara. Migrasi ke MySQL pada rilis berikutnya hanya mengganti lapisan database.

**Struktur proyek:**

```
roomie/
├─ package.json            (scripts: start, dev, smoke)
├─ README.md               (cara menjalankan, akun demo, keputusan desain)
├─ server.js               (bootstrap: migrasi, seed, listen)
├─ src/
│  ├─ db.js                (koneksi + migrasi + seed)
│  ├─ schema.sql           (DDL Bagian 8)
│  ├─ seed.js
│  ├─ auth.js              (sesi, middleware requireRole)
│  ├─ rules.js             (hari kerja, jam kerja, validasi; fungsi murni)
│  ├─ services/booking.js  (ajukan, putuskan, batalkan, checkIn, checkOut)
│  ├─ routes/              (auth, resources, bookings, approvals, usage, notifications, admin, reports)
│  └─ errors.js            (class AppError(code, message, status))
├─ public/
│  ├─ index.html           (kerangka SPA)
│  ├─ css/app.css
│  └─ js/ (app.js, router.js, api.js, ui.js, pages/*.js)
├─ data/                   (dibuat otomatis; di-gitignore)
└─ test/smoke.test.js
```

---

## 7. Fitur per Peran (ringkas)

**Peminjam:** daftar dan login; beranda; katalog ruang; kalender mingguan; ajukan peminjaman (4 langkah); pengajuan saya; detail dan pelacakan status; batalkan; cetak bukti; notifikasi; profil.
**Kemahasiswaan dan GA:** antrean persetujuan sesuai tahap; detail; setuju atau tolak dengan alasan; riwayat keputusan; laporan.
**Satpam:** jadwal hari ini; cari booking dengan kode atau pindai QR; check-in; check-out dengan checklist.
**Admin:** CRUD ruang, fasilitas, pengguna; hari libur; pengaturan; laporan; audit log.

---

## 8. Model Data (SQLite)

Simpan DDL berikut persis sebagai `src/schema.sql` dan jalankan pada start pertama.

```sql
-- SCHEMA_BEGIN
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE CHECK (nama IN ('peminjam','kemahasiswaan','ga','satpam','admin'))
);

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  tipe TEXT NOT NULL DEFAULT 'lainnya' CHECK (tipe IN ('ormawa','prodi','bagian','lainnya'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  unit_id INTEGER REFERENCES units(id),
  nama TEXT NOT NULL,
  nim_nip TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  no_hp TEXT,
  jabatan TEXT,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  tipe TEXT NOT NULL CHECK (tipe IN ('ruang_kelas','ruang_meeting','auditorium','lapangan','area_lainnya')),
  gedung TEXT,
  lantai TEXT,
  kapasitas INTEGER NOT NULL DEFAULT 0 CHECK (kapasitas >= 0),
  deskripsi TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1))
);

CREATE TABLE IF NOT EXISTS facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE,
  satuan TEXT NOT NULL DEFAULT 'unit'
);

CREATE TABLE IF NOT EXISTS resource_facilities (
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  jumlah INTEGER NOT NULL DEFAULT 1 CHECK (jumlah >= 0),
  PRIMARY KEY (resource_id, facility_id)
);

CREATE TABLE IF NOT EXISTS holidays (
  tanggal TEXT PRIMARY KEY,
  keterangan TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  kunci TEXT PRIMARY KEY,
  nilai TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_booking TEXT UNIQUE,
  pemohon_id INTEGER NOT NULL REFERENCES users(id),
  resource_id INTEGER NOT NULL REFERENCES resources(id),
  judul_kegiatan TEXT NOT NULL,
  jenis_kegiatan TEXT NOT NULL CHECK (jenis_kegiatan IN
    ('perkuliahan','ujian','rapat_internal','seminar_workshop','kegiatan_kemahasiswaan','tamu_eksternal','lainnya')),
  jumlah_peserta INTEGER NOT NULL CHECK (jumlah_peserta > 0),
  penanggung_jawab TEXT NOT NULL,
  tanggal TEXT NOT NULL,          -- YYYY-MM-DD (WIB)
  jam_mulai TEXT NOT NULL,        -- HH:MM
  jam_selesai TEXT NOT NULL,      -- HH:MM
  sifat_penggunaan TEXT NOT NULL DEFAULT 'sekali_pakai' CHECK (sifat_penggunaan IN ('sekali_pakai','berkala')),
  di_luar_jam_kerja INTEGER NOT NULL DEFAULT 0 CHECK (di_luar_jam_kerja IN (0,1)),
  status TEXT NOT NULL DEFAULT 'menunggu_kemahasiswaan' CHECK (status IN
    ('menunggu_kemahasiswaan','menunggu_ga','disetujui','ditolak','dibatalkan','berlangsung','selesai')),
  ketentuan_disetujui_at TEXT,
  alasan_pembatalan TEXT,
  catatan_pemohon TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (jam_selesai > jam_mulai)
);
CREATE INDEX IF NOT EXISTS idx_bk_slot ON bookings(resource_id, tanggal, jam_mulai, jam_selesai);
CREATE INDEX IF NOT EXISTS idx_bk_status ON bookings(status, tanggal);
CREATE INDEX IF NOT EXISTS idx_bk_pemohon ON bookings(pemohon_id, created_at);

CREATE TABLE IF NOT EXISTS booking_facilities (
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  jumlah INTEGER NOT NULL DEFAULT 1 CHECK (jumlah > 0),
  keterangan TEXT,
  PRIMARY KEY (booking_id, facility_id)
);

CREATE TABLE IF NOT EXISTS booking_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  nama_file TEXT NOT NULL,
  path TEXT NOT NULL,
  mime TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS booking_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tahap INTEGER NOT NULL CHECK (tahap IN (1,2)),
  approver_id INTEGER REFERENCES users(id),
  keputusan TEXT NOT NULL DEFAULT 'menunggu' CHECK (keputusan IN ('menunggu','disetujui','ditolak')),
  alasan TEXT,
  decided_at TEXT,
  UNIQUE (booking_id, tahap)
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id),
  petugas_id INTEGER NOT NULL REFERENCES users(id),
  check_in_at TEXT,
  check_out_at TEXT,
  kondisi TEXT CHECK (kondisi IN ('baik','ada_kerusakan')),
  catatan_kerusakan TEXT,
  kunci_dikembalikan INTEGER CHECK (kunci_dikembalikan IN (0,1)),
  perangkat_dimatikan INTEGER CHECK (perangkat_dimatikan IN (0,1)),
  catatan_petugas TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  judul TEXT NOT NULL,
  pesan TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_nt_user ON notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  aksi TEXT NOT NULL,
  tabel TEXT NOT NULL,
  record_id INTEGER,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Trigger: cegah double booking di level database
CREATE TRIGGER IF NOT EXISTS trg_bookings_bi BEFORE INSERT ON bookings
WHEN NEW.status IN ('menunggu_kemahasiswaan','menunggu_ga','disetujui','berlangsung')
BEGIN
  SELECT RAISE(ABORT, 'BENTROK_JADWAL')
  WHERE EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.resource_id = NEW.resource_id AND b.tanggal = NEW.tanggal
      AND b.status IN ('menunggu_kemahasiswaan','menunggu_ga','disetujui','berlangsung')
      AND NEW.jam_mulai < b.jam_selesai AND NEW.jam_selesai > b.jam_mulai
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_bookings_bu BEFORE UPDATE OF tanggal, jam_mulai, jam_selesai, resource_id ON bookings
WHEN NEW.status IN ('menunggu_kemahasiswaan','menunggu_ga','disetujui','berlangsung')
BEGIN
  SELECT RAISE(ABORT, 'BENTROK_JADWAL')
  WHERE EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id <> NEW.id AND b.resource_id = NEW.resource_id AND b.tanggal = NEW.tanggal
      AND b.status IN ('menunggu_kemahasiswaan','menunggu_ga','disetujui','berlangsung')
      AND NEW.jam_mulai < b.jam_selesai AND NEW.jam_selesai > b.jam_mulai
  );
END;

-- Trigger: audit perubahan status
CREATE TRIGGER IF NOT EXISTS trg_bookings_au AFTER UPDATE OF status ON bookings
WHEN NEW.status <> OLD.status
BEGIN
  INSERT INTO audit_logs(aksi, tabel, record_id, detail)
  VALUES ('ubah_status', 'bookings', NEW.id, OLD.status || ' -> ' || NEW.status);
  UPDATE bookings SET updated_at = datetime('now') WHERE id = NEW.id;
END;
-- SCHEMA_END
```

**Aturan implementasi data:**
- Galat `BENTROK_JADWAL` dari trigger ditangkap di server dan diubah menjadi respons 409 dengan pesan ramah.
- Setiap operasi yang mengubah lebih dari satu tabel (ajukan, putuskan, batalkan, check-in, check-out) dibungkus `db.transaction(...)` agar atomik.
- Kode booking: `CWE-FORM-{TAHUN}-{ID 5 digit}`, contoh `CWE-FORM-2026-00012`. Isi setelah INSERT memakai `lastInsertRowid`, di dalam transaksi yang sama.
- Saat pengajuan dibuat, buat dua baris `booking_approvals` (tahap 1 dan 2, keputusan `menunggu`).
- Jangan pernah menghapus booking; gunakan status.

---

## 9. Spesifikasi UI dan UX

### 9.1 Prinsip
- **Satu tujuan per layar.** Pengguna selalu tahu langkah berikutnya; tombol utama hanya satu dan menonjol.
- **Bahasa sehari-hari**, bukan istilah teknis. Contoh: "Ruang ini sudah dipakai pukul 10.00–12.00", bukan "Conflict 409".
- **Mobile-first**: nyaman di layar 360 px; target sentuh minimal 44 px.
- **Tidak ada jalan buntu**: setiap kondisi kosong dan galat menyertakan penjelasan dan tombol tindakan.

### 9.2 Desain visual

| Elemen | Nilai |
|---|---|
| Warna utama | Teal tua `#0F4C5C`; hover `#0B3A47` |
| Latar halaman | `#F4F7F9`; kartu putih, border `#CFD8DC`, radius 10 px, bayangan lembut |
| Teks | Utama `#1F2D3A`, sekunder `#546E7A` |
| Font | `Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` (tanpa unduhan font) |
| Ukuran dasar | 16 px; judul halaman 24 px; judul kartu 18 px |
| Jarak | Kelipatan 8 px |
| Kontras | Minimal WCAG AA |

**Warna status (selalu disertai teks, bukan warna saja):**

| Status | Label tampil | Latar / teks |
|---|---|---|
| menunggu_kemahasiswaan | Menunggu Kemahasiswaan | `#FFF3E0` / `#E65100` |
| menunggu_ga | Menunggu GA | `#FFF3E0` / `#E65100` |
| disetujui | Disetujui | `#E8F5E9` / `#2E7D32` |
| ditolak | Ditolak | `#FFEBEE` / `#C62828` |
| dibatalkan | Dibatalkan | `#ECEFF1` / `#546E7A` |
| berlangsung | Sedang Berlangsung | `#E3F2FD` / `#1565C0` |
| selesai | Selesai | `#E0F2F1` / `#00695C` |

**Komponen bersama:** bilah navigasi atas (logo ROOMIE, menu sesuai peran, lonceng notifikasi dengan angka, menu pengguna); di mobile menjadi menu geser. Toast (pojok bawah, `aria-live="polite"`, hilang 4 detik). Modal konfirmasi untuk aksi yang tidak dapat dibatalkan. Skeleton saat memuat. Tombol menjadi nonaktif dan menampilkan "Memproses..." saat permintaan berjalan, agar tidak terkirim dua kali.

### 9.3 Navigasi per peran

| Peran | Menu |
|---|---|
| peminjam | Beranda, Ruang, Kalender, Pengajuan Saya |
| kemahasiswaan, ga | Beranda, Persetujuan, Kalender, Laporan |
| satpam | Hari Ini (halaman utama), Kalender |
| admin | Beranda, Kalender, Laporan, Admin |

Semua peran: lonceng Notifikasi dan menu Profil (ubah nama, nomor HP, kata sandi; keluar).

Halaman awal setelah login: peminjam, kemahasiswaan, ga, dan admin ke `#/beranda`; satpam ke `#/satpam`.

### 9.4 Layar

**1. Masuk (`#/masuk`) dan Daftar (`#/daftar`)**
- Kartu di tengah: email, kata sandi (dengan tombol tampilkan), tombol **Masuk**. Tautan "Belum punya akun? Daftar".
- Daftar: nama lengkap, NIM/NIP, email, nomor HP, unit (pilihan dari `units`), kata sandi (min. 8 karakter, ada huruf dan angka), ulangi kata sandi.
- Panel "Coba dengan akun demo" (jika `DEMO_MODE`): lima tombol, satu per peran.
- Galat: "Email atau kata sandi salah." (jangan membedakan keduanya). Setelah 5 kali gagal berturut-turut untuk satu email, tahan 5 menit dan tampilkan pesan.

**2. Beranda peminjam (`#/beranda`)**
- Sapaan "Halo, {nama}".
- Tombol besar **+ Ajukan Peminjaman**.
- Tiga kartu angka: *Menunggu keputusan*, *Disetujui akan datang*, *Selesai bulan ini*; masing-masing dapat diklik ke daftar terfilter.
- Daftar "Acara Anda berikutnya" (maks. 5, urut tanggal) dengan label status.
- Keadaan kosong: "Anda belum punya pengajuan. Mulai dengan memilih ruang." + tombol.

**Beranda kemahasiswaan/GA:** kartu "Menunggu persetujuan Anda" (angka, tombol "Buka antrean"), kartu "Di luar jam kerja" (khusus GA), dan daftar 5 pengajuan tertua yang menunggu.
**Beranda admin:** kartu ringkas (jumlah pengajuan bulan ini, ruang paling sering dipakai, pengajuan menunggu) dan pintasan ke Admin.

**3. Ruang (`#/ruang`)**
- Filter chip jenis: Semua, Ruang Kelas, Ruang Meeting, Auditorium, Lapangan, Area Lain. Kolom cari nama.
- Kartu ruang: nama, label jenis, gedung/lantai, kapasitas ("Maks. 40 orang"), chip fasilitas, tombol **Lihat Jadwal** dan **Pinjam**.
- Ruang nonaktif tidak tampil untuk peminjam.

**4. Kalender (`#/kalender?ruang=ID&tanggal=YYYY-MM-DD`)**
- Pilih ruang (dropdown), tombol ‹ Minggu lalu | **Hari ini** | Minggu depan ›, dan pemilih tanggal.
- Tampilan **mingguan Senin–Minggu**, jam 07:00–22:00 dengan garis tiap 30 menit. Blok booking berwarna sesuai status dan berisi judul singkat dan jam. Klik blok membuka ringkasan (pemohon, kegiatan, status). Peminjam hanya melihat judul dan status untuk booking orang lain, tanpa kontak.
- Hari libur dan akhir pekan diberi latar abu dengan label.
- Klik area kosong (peminjam) membuka `#/ajukan` dengan ruang, tanggal, dan jam mulai terisi. Slot yang sudah lewat tidak dapat diklik.
- Mobile: tampilkan **satu hari** dengan tombol ‹ ›, bukan seminggu penuh.
- Legenda warna di bawah kalender.

**5. Ajukan Peminjaman (`#/ajukan`)**: pengisian 4 langkah dengan indikator "Langkah 2 dari 4". Data tersimpan di memori selama pengguna belum keluar halaman; tombol Kembali tidak menghapus isian.

- **Langkah 1, Ruang dan Waktu:** ruang, tanggal, jam mulai, jam selesai. Saat semua terisi, panggil API ketersediaan dan tampilkan langsung salah satu pesan: hijau "Ruang tersedia", merah "Bentrok dengan {judul} pukul {jam}" (disertai saran jam kosong terdekat), atau kuning "Di luar jam kerja: pengajuan ini akan diteruskan ke GA dengan penanda khusus". Pesan terkait aturan 2 hari kerja tampil di bawah kolom tanggal ("Pengajuan paling cepat untuk tanggal {tanggal}"). Tombol **Lanjut** nonaktif selama ada galat.
- **Langkah 2, Data Kegiatan:** judul kegiatan, jenis kegiatan (daftar sesuai CWE-FORM: Perkuliahan/KBM, Ujian, Rapat/Meeting Internal, Seminar/Workshop/Pelatihan, Kegiatan Kemahasiswaan/UKM, Tamu/Kunjungan Eksternal, Lainnya), jumlah peserta (dibandingkan kapasitas secara langsung), penanggung jawab kegiatan (default nama pemohon), sifat penggunaan (Sekali pakai; "Berkala" **dinonaktifkan** dengan keterangan "Segera hadir di versi berikutnya" sesuai ruang lingkup), catatan tambahan (opsional). Bagian "Data Pemohon" tampil hanya-baca (nama, NIM/NIP, unit, jabatan, nomor HP, email) diambil dari akun, dengan tautan "Perbarui profil".
- **Langkah 3, Fasilitas dan Dokumen:** daftar fasilitas yang tersedia di ruang terpilih sebagai kartu dengan kotak centang dan kolom jumlah (maks. sesuai stok ruang) serta keterangan singkat. Fasilitas "Lainnya" menerima teks bebas. Unggah dokumen pendukung (opsional; wajib dianjurkan jika di luar jam kerja, dengan teks "Lampirkan surat izin tertulis jika ada").
- **Langkah 4, Tinjau dan Kirim:** ringkasan seluruh isian dengan tombol "Ubah" per bagian. Di bawahnya kotak berisi **9 ketentuan** (teks di Bagian 9.5) dan kotak centang "Saya telah membaca, memahami, dan menyetujui seluruh ketentuan di atas". Tombol **Kirim Pengajuan** aktif hanya jika dicentang.
- **Setelah terkirim:** halaman sukses berisi kode booking besar, kalimat "Pengajuan Anda diteruskan ke Kemahasiswaan", dan tombol "Lihat Status" dan "Ajukan Lagi".

**6. Pengajuan Saya (`#/pengajuan`)**
- Tab filter: Semua, Berjalan, Disetujui, Selesai, Ditolak/Dibatalkan. Kolom cari (kode atau judul).
- Setiap kartu: kode, judul, ruang, tanggal dan jam, label status. Klik membuka detail.

**7. Detail Pengajuan (`#/pengajuan/:id`)**
- Kepala: kode, judul, label status.
- **Pelacak 5 langkah** (stepper): Diajukan → Kemahasiswaan → GA → Disetujui → Selesai. Langkah selesai berwarna hijau dengan waktu; langkah aktif oranye; langkah belum berwarna abu. Jika ditolak, langkah tempat penolakan berwarna merah disertai **kotak alasan** yang jelas. Jika dibatalkan, tampilkan banner abu.
- Kartu Ringkasan (ruang, tanggal, jam, peserta, penanggung jawab), kartu Fasilitas, kartu Dokumen (tautan unduh), kartu Riwayat Keputusan (tahap, pemutus, keputusan, alasan, waktu).
- Jika disetujui: tampilkan **QR code** dan kode booking dengan keterangan "Tunjukkan kepada Satpam saat memakai ruang".
- Tombol: **Batalkan** (hanya jika boleh menurut BR-07; jika tidak boleh, tombol tetap tampil nonaktif dengan alasan di bawahnya), **Cetak Bukti** (membuka `#/cetak/:id`).
- Jika sudah selesai: kartu "Pemakaian aktual" (jam masuk, jam keluar, kondisi ruang, catatan).

**8. Persetujuan (`#/persetujuan`) untuk kemahasiswaan dan ga**
- Dua tab: **Menunggu** (hanya sesuai tahap peran) dan **Riwayat Saya**.
- Daftar: kode, judul, pemohon dan unit, ruang, jadwal, label "Di luar jam kerja" jika ada, "Menunggu sejak {n} jam/hari".
- Klik baris membuka panel detail (drawer) berisi seluruh data, fasilitas, dan dokumen. Dua tombol: **Setujui** (hijau; modal konfirmasi singkat) dan **Tolak** (merah; modal dengan kolom alasan wajib dan penghitung karakter).
- Setelah keputusan, baris hilang dari antrean, toast "Pengajuan diteruskan ke GA" atau "Pengajuan ditolak dan pemohon diberi tahu".

**9. Satpam (`#/satpam`)**
- Kolom **Cari booking**: ketik kode lalu Enter, atau tombol **Pindai QR** (gunakan `BarcodeDetector` dan kamera jika tersedia; jika tidak, sembunyikan tombol dan tampilkan teks "Ketik kode booking"). QR berisi kode booking saja.
- Daftar "Jadwal hari ini" (booking `disetujui` dan `berlangsung` pada tanggal hari ini, urut jam). Kartu menampilkan ruang, jam, pemohon, penanggung jawab, dan nomor HP pemohon.
- Tombol **Check-in** pada kartu berstatus `disetujui`; tombol **Check-out** pada `berlangsung`.
- Modal check-out: kotak centang "Proyektor dan AC sudah dimatikan", kotak centang "Kunci sudah dikembalikan", pilihan kondisi (Baik / Ada kerusakan atau kehilangan), kolom keterangan kerusakan (wajib bila rusak), catatan petugas. Tombol **Selesaikan**.

**10. Notifikasi (`#/notifikasi`)**
- Daftar terbaru lebih dulu; yang belum dibaca bercetak tebal dengan titik penanda. Klik membuka pengajuan terkait dan menandai terbaca. Tombol "Tandai semua terbaca". Lonceng di navigasi memuat ulang jumlah belum dibaca setiap 30 detik.

**11. Laporan (`#/laporan`) untuk kemahasiswaan, ga, dan admin**
- Filter: dari tanggal, sampai tanggal, ruang, jenis ruang, status. Tombol **Terapkan** dan **Unduh CSV**.
- Kartu ringkasan: total pengajuan, disetujui, ditolak, dibatalkan, selesai, jumlah kejadian kerusakan.
- Grafik batang sederhana (HTML/CSS, tanpa pustaka): penggunaan per ruang dan per bulan.
- Tabel rinci dengan kolom: kode, tanggal, ruang, pemohon, unit, kegiatan, peserta, status, jam masuk, jam keluar, kondisi.

**12. Admin (`#/admin`), tab:**
- **Ruang:** tabel + tombol Tambah/Ubah (kode, nama, jenis, gedung, lantai, kapasitas, deskripsi, fasilitas beserta jumlahnya, aktif). Menonaktifkan ruang yang punya booking mendatang tampilkan peringatan jumlahnya.
- **Fasilitas:** tambah/ubah nama dan satuan.
- **Pengguna:** cari, ubah peran dan unit, aktif/nonaktif, atur ulang kata sandi (admin memasukkan sandi sementara). Admin tidak dapat menonaktifkan atau menurunkan peran dirinya sendiri.
- **Hari Libur:** tambah/hapus tanggal dan keterangan.
- **Pengaturan:** jam kerja, minimal hari pengajuan, minimal hari pembatalan, hari kerja.
- **Audit Log:** 200 entri terbaru, dengan filter aksi.

**13. Cetak Bukti (`#/cetak/:id`)**
- Halaman ramah cetak (CSS `@media print`) meniru CWE-FORM: judul "FORMULIR PENGGUNAAN RUANG", kode booking, bagian A Data Pemohon, B Data Kegiatan, C Detail Peminjaman, D Kebutuhan Fasilitas, 9 ketentuan, F Pengesahan (nama, jabatan, dan waktu keputusan Kemahasiswaan dan GA), kondisi setelah pemakaian (jika ada), dan QR. Tombol **Cetak / Simpan PDF** memanggil `window.print()`; tombol dan navigasi disembunyikan saat cetak.

### 9.5 Teks 9 ketentuan (tampil di Langkah 4 dan di cetak)

1. Pemohon wajib mengajukan formulir minimal 2 (dua) hari kerja sebelum tanggal penggunaan.
2. Penggunaan ruang harus sesuai dengan jadwal dan jenis kegiatan yang disetujui.
3. Pemohon bertanggung jawab atas kebersihan, kerapian, dan kondisi ruang serta fasilitas selama penggunaan.
4. Segala bentuk kerusakan fasilitas akibat kelalaian menjadi tanggung jawab penuh pemohon/penanggung jawab kegiatan.
5. Penggunaan ruang di luar jam kerja wajib mendapat persetujuan tertulis dari Kabag Umum/Sarpras.
6. Dilarang memindahkan atau mengubah tata letak ruang tanpa izin.
7. Pemohon wajib mematikan proyektor dan AC setelah acara selesai.
8. Pemohon wajib mengembalikan kunci dan menyerahkan ruang dalam kondisi semula setelah kegiatan selesai.
9. Pembatalan peminjaman harus disampaikan minimal 1 (satu) hari sebelumnya.

### 9.6 Teks pesan penting

| Situasi | Teks |
|---|---|
| Bentrok | "Ruang ini sudah dipakai pada {jam_mulai}–{jam_selesai} untuk \"{judul}\". Coba jam lain." |
| Kurang hari kerja | "Pengajuan minimal 2 hari kerja sebelum tanggal penggunaan. Tanggal paling cepat: {tanggal}." |
| Kapasitas | "Jumlah peserta melebihi kapasitas ruang ({kapasitas} orang)." |
| Di luar jam kerja | "Di luar jam kerja. Pengajuan akan diteruskan ke GA dengan penanda khusus." |
| Pembatalan terlambat | "Pembatalan harus dilakukan minimal 1 hari sebelum tanggal penggunaan." |
| Alasan kosong | "Tuliskan alasan penolakan agar pemohon dapat memperbaikinya." |
| Sesi habis | "Sesi Anda berakhir. Silakan masuk kembali." |
| Tidak berwenang | "Anda tidak memiliki akses ke halaman ini." |

### 9.7 Notifikasi otomatis

| Kejadian | Penerima | Judul / pesan |
|---|---|---|
| Pengajuan dikirim | Semua `kemahasiswaan` aktif | "Pengajuan baru" / "{kode}: {judul} menunggu verifikasi Anda." |
| Tahap 1 setuju | Semua `ga` aktif; pemohon | GA: "Menunggu persetujuan Anda". Pemohon: "Diteruskan ke GA". |
| Tahap 2 setuju | Pemohon; semua `satpam` aktif | Pemohon: "Pengajuan disetujui. Tunjukkan QR kepada Satpam." Satpam: "Jadwal baru disetujui: {ruang}, {tanggal} {jam}." |
| Ditolak | Pemohon | "Pengajuan ditolak" / "Alasan: {alasan}" |
| Dibatalkan oleh pemohon | Pemutus tahap yang sedang menunggu; Satpam jika sudah disetujui | "Pengajuan {kode} dibatalkan oleh pemohon." |
| Check-in | Pemohon | "Penggunaan ruang dimulai." |
| Check-out | Pemohon; jika rusak, juga semua `ga` | "Penggunaan selesai." / GA: "Kerusakan tercatat pada {kode}." |

---

## 10. API

Format: JSON, `Content-Type: application/json`, kecuali unggah (`multipart/form-data`). Galat selalu `{ "error": { "code": "BENTROK_JADWAL", "message": "teks ramah" } }`. Tanpa sesi: 401 `BELUM_MASUK`. Peran salah: 403 `TIDAK_BERWENANG`. Validasi input: 422 `INPUT_TIDAK_VALID` dengan `fields: { namaKolom: "pesan" }`. Semua query memakai parameter terikat.

| Metode dan path | Peran | Keterangan |
|---|---|---|
| `POST /api/auth/daftar` | publik | Buat akun `peminjam`; langsung login |
| `POST /api/auth/masuk` | publik | Body `{email, password}`; set cookie; balas data pengguna |
| `POST /api/auth/keluar` | semua | Hapus sesi |
| `GET /api/saya` | semua | Data pengguna + jumlah notifikasi belum dibaca |
| `PATCH /api/saya` | semua | Ubah nama, no_hp, jabatan; ubah kata sandi dengan `password_lama` dan `password_baru` |
| `GET /api/meta` | semua | Daftar unit, fasilitas, jenis kegiatan, pengaturan, hari libur |
| `GET /api/ruang` | semua | Query `tipe`, `q`; hanya aktif untuk non-admin; sertakan fasilitas |
| `GET /api/ruang/:id` | semua | Detail ruang |
| `GET /api/ruang/:id/ketersediaan?tanggal=&mulai=&selesai=` | semua | `{tersedia, bentrok:[{judul,mulai,selesai}], di_luar_jam_kerja, minimal_tanggal, saran:[{mulai,selesai}]}` |
| `GET /api/kalender?ruang=&dari=&sampai=` | semua | Booking berstatus penahan jadwal dan `selesai`, plus hari libur. Peminjam lain hanya melihat judul, jam, status |
| `POST /api/booking` | peminjam | Ajukan. Body: `resource_id, judul_kegiatan, jenis_kegiatan, jumlah_peserta, penanggung_jawab, tanggal, jam_mulai, jam_selesai, sifat_penggunaan, catatan_pemohon, fasilitas:[{facility_id,jumlah,keterangan}], setuju_ketentuan:true`. Balas 201 dengan booking |
| `POST /api/booking/:id/dokumen` | pemilik | Unggah satu berkas (field `file`) |
| `GET /api/dokumen/:id` | pemilik, kemahasiswaan, ga, admin | Unduh berkas |
| `GET /api/booking?status=&q=` | peminjam | Milik sendiri |
| `GET /api/booking/:id` | pemilik; kemahasiswaan, ga, satpam, admin | Detail lengkap: ruang, pemohon, fasilitas, dokumen, persetujuan, usage log, `bisa_dibatalkan`, `alasan_tidak_bisa_dibatalkan` |
| `POST /api/booking/:id/batal` | pemilik | Body `{alasan}` |
| `GET /api/booking/:id/qr` | pemilik, satpam | SVG QR berisi kode booking |
| `GET /api/persetujuan?tab=menunggu\|riwayat` | kemahasiswaan, ga | Antrean sesuai tahap peran |
| `POST /api/booking/:id/keputusan` | kemahasiswaan, ga | Body `{keputusan:"disetujui"\|"ditolak", alasan}`; tahap ditentukan server dari peran |
| `GET /api/satpam/hari-ini` | satpam, admin | Booking `disetujui` dan `berlangsung` pada tanggal WIB hari ini |
| `GET /api/satpam/cari?kode=` | satpam, admin | Cari berdasarkan kode booking |
| `POST /api/booking/:id/check-in` | satpam | |
| `POST /api/booking/:id/check-out` | satpam | Body `{kondisi, catatan_kerusakan, kunci_dikembalikan, perangkat_dimatikan, catatan_petugas}` |
| `GET /api/notifikasi` | semua | 50 terbaru |
| `POST /api/notifikasi/:id/baca`, `POST /api/notifikasi/baca-semua` | semua | |
| `GET /api/laporan/ringkasan?dari=&sampai=&ruang=&tipe=&status=` | kemahasiswaan, ga, admin | Angka ringkasan dan data grafik |
| `GET /api/laporan/data?...` | sama | Baris rinci |
| `GET /api/laporan/csv?...` | sama | Unduh CSV (UTF-8 dengan BOM, pemisah koma) |
| `GET/POST/PATCH /api/admin/ruang(/:id)` | admin | Termasuk fasilitas ruang |
| `GET/POST/PATCH /api/admin/fasilitas(/:id)` | admin | |
| `GET/POST/PATCH /api/admin/pengguna(/:id)` | admin | |
| `GET/POST/DELETE /api/admin/libur(/:tanggal)` | admin | |
| `GET/PUT /api/admin/pengaturan` | admin | |
| `GET /api/admin/audit?aksi=` | admin | 200 terbaru |
| `GET /healthz` | publik | `{status:"ok"}` |

**Keamanan minimal:** hash `bcryptjs` (cost 10); cookie `HttpOnly` + `SameSite=Lax`; tolak metode mengubah data jika header `Origin` berbeda host (perlindungan CSRF sederhana); batasi percobaan login; semua keluaran HTML di frontend di-escape (jangan pakai `innerHTML` dengan data pengguna tanpa escape); berkas unggahan divalidasi jenis dan ukuran, diberi nama acak, dan hanya dapat diunduh lewat API dengan pemeriksaan hak akses; header `X-Content-Type-Options: nosniff`.

---

## 11. Data Awal (Seed)

Seed berjalan **hanya jika tabel `users` kosong**.

**Units:** Dewan Perwakilan Mahasiswa (ormawa); Teknologi Rekayasa Perangkat Lunak (prodi); Kemahasiswaan (bagian); Umum dan Sarana Prasarana (bagian); Keamanan (bagian).

**Fasilitas:** Meja (unit), Kursi (unit), LCD Projector / TV (unit), Sound System / Microphone (set), AC / Kipas Angin (unit), Whiteboard & Spidol (set), Laptop / Komputer (unit), Akses Internet / Wi-Fi (titik), Konsumsi (Snack / Makan) (porsi), Lainnya (-).

**Ruang (contoh; admin dapat mengubah):**

| Kode | Nama | Jenis | Gedung | Lantai | Kapasitas | Fasilitas (jumlah) |
|---|---|---|---|---|---|---|
| R-7.3 | Ruang Kelas 7.3 | ruang_kelas | Gedung 2 | 7 | 40 | Meja 20, Kursi 40, LCD 1, AC 2, Whiteboard 1, Wi-Fi 1 |
| R-7.4 | Ruang Kelas 7.4 | ruang_kelas | Gedung 2 | 7 | 40 | Meja 20, Kursi 40, LCD 1, AC 2, Whiteboard 1, Wi-Fi 1 |
| RM-01 | Ruang Meeting 1 | ruang_meeting | Gedung 1 | 2 | 15 | Meja 1, Kursi 15, LCD 1, AC 1, Wi-Fi 1 |
| AUD-01 | Auditorium | auditorium | Gedung 1 | 1 | 200 | Kursi 200, LCD 1, Sound 1, AC 6, Wi-Fi 1 |
| LP-01 | Lapangan Serbaguna | lapangan | - | - | 100 | Sound 1 |
| AR-LIFT2 | Area Depan Lift Gedung Dua | area_lainnya | Gedung 2 | - | 50 | Meja 4, Kursi 50 |

**Hari libur:** 2026-12-25 Hari Raya Natal; 2027-01-01 Tahun Baru Masehi. (Admin menambah lainnya.)

**Pengguna demo:** lima akun di Bagian 2 (unit: Rani ke Dewan Perwakilan Mahasiswa, Bu Sari ke Kemahasiswaan, Pak Budi ke Umum dan Sarana Prasarana, Pak Dimas ke Keamanan). NIM/NIP unik bebas, mis. `202500001`.

**Booking demo** (tanggal dihitung **relatif terhadap hari seed**, agar selalu tampak segar; tanggal harus hari kerja dan memenuhi BR-01 kecuali untuk yang berstatus selesai, yang dimasukkan langsung ke database):
- 1 booking `menunggu_kemahasiswaan` (Rapat DPM, Ruang 7.3, +5 hari kerja, 13:00–15:00).
- 1 booking `menunggu_ga` (Seminar Pengembangan Diri, Auditorium, +7 hari kerja, 09:00–12:00).
- 1 booking `disetujui` (Latihan UKM, Lapangan Serbaguna, hari ini +3 hari kerja, 15:00–17:00).
- 1 booking `disetujui` **untuk hari ini** (Rapat Panitia, Ruang Meeting 1, 10:00–12:00) agar halaman Satpam tidak kosong.
- 1 booking `ditolak` dengan alasan "Jadwal bertabrakan dengan ujian".
- 1 booking `selesai` (kemarin atau hari kerja terakhir) lengkap dengan usage log kondisi `baik`.
- 1 booking `selesai` bulan lalu dengan kondisi `ada_kerusakan` ("Kabel proyektor putus") agar laporan punya data.

Semua booking demo dibuat atas nama Rani Putri, dan booking `menunggu_ga` ke atas memiliki baris persetujuan yang konsisten dengan statusnya.

---

## 12. Perilaku Server yang Wajib Benar

- `rules.js` berisi fungsi murni yang diuji tersendiri: `hitungHariKerja(dari, sampai, libur, hariKerja)`, `adaIrisan(a, b)`, `diLuarJamKerja(tanggal, mulai, selesai, pengaturan, libur)`, `tanggalHariIniWIB()`, `tambahHariKerja(tanggal, n)`.
- `ajukan()`: transaksi tunggal yang menjalankan BR-14, BR-13, BR-11, BR-10, BR-01, BR-04, BR-03; memasukkan booking, fasilitas, dua baris persetujuan, notifikasi; menangkap `BENTROK_JADWAL`.
- `putuskan()`: periksa BR-08 dan BR-09 **di dalam transaksi** setelah membaca status terbaru (cegah dua petugas memutuskan bersamaan; pemutus kedua mendapat `STATUS_TIDAK_VALID`).
- Respons daftar tidak membocorkan data pribadi (nomor HP, email) kepada pihak yang tidak berhak. Nomor HP pemohon hanya tampil untuk peran satpam, kemahasiswaan, ga, admin, dan pemilik.
- Katalog ketersediaan tidak boleh menampilkan booking berstatus `ditolak` atau `dibatalkan`.

---

## 13. Persyaratan Non-Fungsional

| Aspek | Target |
|---|---|
| Kinerja | Halaman utama dan kalender memuat < 2 detik untuk 50 pengguna bersamaan |
| Responsif | Berfungsi di lebar 360 px sampai 1440 px tanpa gulir horizontal pada halaman |
| Peramban | Chrome, Firefox, Edge, Safari versi terbaru |
| Aksesibilitas | Semua input berlabel; fokus terlihat; dapat dioperasikan dengan keyboard; modal menjebak fokus dan menutup dengan Esc |
| Ketahanan | Server tidak boleh berhenti karena input buruk; semua galat ditangkap dan dibalas dengan format galat standar |
| Pemeliharaan | Kode terpisah per lapisan; `README.md` menjelaskan menjalankan, akun demo, struktur, dan keputusan desain |
| Pencadangan | Tombol di Admin "Unduh cadangan database" yang mengunduh `roomie.db` (hanya admin) |

---

## 14. Pengujian dan Kriteria Selesai

Buat `test/smoke.test.js` (jalankan dengan `npm run smoke`). Skrip menyalakan server pada port acak dengan database sementara, memakai `fetch` dengan penyimpan cookie, dan memeriksa **semua** skenario berikut:

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| T-01 | Login dengan akun demo benar dan salah | Benar: 200; salah: 401 dengan pesan umum |
| T-02 | Peminjam memanggil `GET /api/persetujuan` | 403 |
| T-03 | Ajukan booking valid untuk 3 hari kerja ke depan | 201; status `menunggu_kemahasiswaan`; kode `CWE-FORM-{tahun}-NNNNN`; dua baris persetujuan |
| T-04 | Ajukan jadwal beririsan di ruang dan tanggal yang sama | 409 `BENTROK_JADWAL`; tidak ada baris baru |
| T-05 | Ajukan 10:00–12:00 lalu 12:00–14:00 pada ruang dan tanggal sama | Keduanya berhasil (tidak bentrok) |
| T-06 | Ajukan untuk besok (kurang dari 2 hari kerja) | 422 `MINIMAL_HARI_KERJA` |
| T-07 | Ajukan tepat 2 hari kerja ke depan | 201 |
| T-08 | Ajukan pukul 19:00–21:00 | 201 dengan `di_luar_jam_kerja = 1` |
| T-09 | Ajukan pada hari Sabtu | 201 dengan `di_luar_jam_kerja = 1` |
| T-10 | Peserta melebihi kapasitas | 422 `KAPASITAS_TERLAMPAUI` |
| T-11 | Ajukan ke ruang nonaktif | 422 `RUANG_NONAKTIF` |
| T-12 | Ajukan tanpa `setuju_ketentuan` | 422 `KETENTUAN_BELUM_DISETUJUI` |
| T-13 | Dua permintaan bersamaan untuk slot yang sama (`Promise.all`) | Tepat satu 201 dan satu 409 |
| T-14 | GA memutuskan saat status masih `menunggu_kemahasiswaan` | 403 `TAHAP_TIDAK_SESUAI` |
| T-15 | Kemahasiswaan menolak tanpa alasan | 422 `ALASAN_WAJIB` |
| T-16 | Kemahasiswaan setuju lalu GA setuju | Status `disetujui`; notifikasi ke pemohon dan semua satpam |
| T-17 | Kemahasiswaan menolak dengan alasan | Status `ditolak`; pemohon menerima notifikasi berisi alasan; slot kembali bebas (ajukan ulang jadwal sama berhasil) |
| T-18 | Satpam check-in pada booking `menunggu_ga` | 409 `STATUS_TIDAK_VALID` |
| T-19 | Check-in, lalu check-out tanpa mencentang kunci | 422 `CHECKLIST_BELUM_LENGKAP` |
| T-20 | Check-out kondisi rusak tanpa keterangan | 422 `KETERANGAN_KERUSAKAN_WAJIB` |
| T-21 | Check-out lengkap | Status `selesai`; usage log terisi |
| T-22 | Pembatalan booking untuk besok | Berhasil; status `dibatalkan`; slot bebas |
| T-23 | Pembatalan booking pada hari-H | 422 `PEMBATALAN_TERLALU_MEPET` |
| T-24 | Peminjam B membuka booking milik peminjam A | 403 |
| T-25 | Laporan CSV | Berisi header dan baris sesuai data; diawali BOM UTF-8 |
| T-26 | Admin menonaktifkan diri sendiri | 422 |
| T-27 | `rules.js`: `hitungHariKerja` melewati akhir pekan dan hari libur | Senin ke Rabu = 2; Jumat ke Senin = 1; rentang yang memuat 25 Des 2026 tidak menghitung tanggal itu |
| T-28 | Percobaan login gagal 5 kali | Percobaan berikutnya ditahan dengan pesan tunggu |
| T-29 | Unggah berkas `.exe` atau lebih dari 2 MB | 422 |
| T-30 | `GET /healthz` | 200 |

**Definition of Done:**
1. `npm install && npm start` berhasil pada mesin bersih, dan aplikasi terbuka di `/` dengan data demo.
2. `npm run smoke` lulus 100 persen dan hasilnya dilaporkan.
3. Setiap layar di Bagian 9.4 dapat dibuka dan dipakai dari awal sampai akhir dengan akun demo yang sesuai, **tanpa galat di konsol peramban**.
4. Tidak ada teks Inggris yang tampil kepada pengguna selain nama merek.
5. `README.md` memuat cara menjalankan, daftar akun demo, variabel lingkungan (`PORT`, `DEMO_MODE`, `DATA_DIR`), dan keputusan desain.
6. Tidak ada rahasia yang tertanam selain kata sandi demo yang dijelaskan di README.

**Skenario uji manual penutup (lakukan sebagai pengguna sungguhan):** masuk sebagai Rani, ajukan Rapat untuk 3 hari kerja ke depan, lihat status; masuk sebagai Bu Sari dan setujui; masuk sebagai Pak Budi dan setujui; masuk sebagai Rani dan lihat QR serta cetak bukti; masuk sebagai Pak Dimas, check-in dan check-out booking hari ini; masuk sebagai admin dan unduh laporan CSV.

---

## 15. Di Luar Cakupan Versi Ini (jangan dikerjakan)

Peminjaman berkala otomatis, peminjaman barang terpisah, email atau WhatsApp otomatis, integrasi SIAKAD, tanda tangan digital tersertifikasi, aplikasi mobile native, multi-bahasa, dan tema gelap.
