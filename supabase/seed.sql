-- ==============================================================================
-- ROOMIE - Sistem Manajemen Peminjaman Ruang & Lapangan Kampus
-- Supabase (PostgreSQL) Initial Seed Data
-- ==============================================================================

-- 1. Roles
INSERT INTO "Role" ("id", "nama") VALUES
(1, 'peminjam'),
(2, 'kemahasiswaan'),
(3, 'ga'),
(4, 'satpam'),
(5, 'admin')
ON CONFLICT ("id") DO NOTHING;

-- Reset sequence for Role
SELECT setval(pg_get_serial_sequence('"Role"', 'id'), COALESCE(max("id"), 1)) FROM "Role";

-- 2. Units
INSERT INTO "Unit" ("id", "nama", "tipe") VALUES
(1, 'Dewan Perwakilan Mahasiswa', 'ormawa'),
(2, 'Teknologi Rekayasa Perangkat Lunak', 'prodi'),
(3, 'Kemahasiswaan', 'bagian'),
(4, 'Umum dan Sarana Prasarana', 'bagian'),
(5, 'Keamanan', 'bagian')
ON CONFLICT ("id") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Unit"', 'id'), COALESCE(max("id"), 1)) FROM "Unit";

-- 3. Facilities
INSERT INTO "Facility" ("id", "nama", "satuan") VALUES
(1, 'Meja', 'unit'),
(2, 'Kursi', 'unit'),
(3, 'LCD Projector / TV', 'unit'),
(4, 'Sound System / Microphone', 'set'),
(5, 'AC / Kipas Angin', 'unit'),
(6, 'Whiteboard & Spidol', 'set'),
(7, 'Laptop / Komputer', 'unit'),
(8, 'Akses Internet / Wi-Fi', 'titik'),
(9, 'Konsumsi (Snack / Makan)', 'porsi'),
(10, 'Lainnya', '-')
ON CONFLICT ("id") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Facility"', 'id'), COALESCE(max("id"), 1)) FROM "Facility";

-- 4. Settings
INSERT INTO "Setting" ("kunci", "nilai") VALUES
('jam_kerja_mulai', '08:00'),
('jam_kerja_selesai', '17:00'),
('min_hari_kerja_pengajuan', '2'),
('min_hari_pembatalan', '1'),
('hari_kerja', '1,2,3,4,5')
ON CONFLICT ("kunci") DO UPDATE SET "nilai" = EXCLUDED."nilai";

-- 5. Holidays
INSERT INTO "Holiday" ("tanggal", "keterangan") VALUES
('2026-12-25', 'Hari Raya Natal'),
('2027-01-01', 'Tahun Baru Masehi')
ON CONFLICT ("tanggal") DO UPDATE SET "keterangan" = EXCLUDED."keterangan";

-- 6. Resources
INSERT INTO "Resource" ("id", "kode", "nama", "tipe", "gedung", "lantai", "kapasitas", "deskripsi", "isActive") VALUES
(1, 'R-7.3', 'Ruang Kelas 7.3', 'ruang_kelas', 'Gedung 2', '7', 40, 'Ruang kelas standar dengan proyektor dan papan tulis.', 1),
(2, 'R-7.4', 'Ruang Kelas 7.4', 'ruang_kelas', 'Gedung 2', '7', 40, 'Ruang kelas standar dekat tangga.', 1),
(3, 'RM-01', 'Ruang Meeting 1', 'ruang_meeting', 'Gedung 1', '2', 15, 'Ruang rapat kecil dengan layar TV.', 1),
(4, 'AUD-01', 'Auditorium', 'auditorium', 'Gedung 1', '1', 200, 'Aula utama untuk seminar dan acara besar.', 1),
(5, 'LP-01', 'Lapangan Serbaguna', 'lapangan', NULL, NULL, 100, 'Lapangan terbuka untuk olahraga dan acara mahasiswa.', 1),
(6, 'AR-LIFT2', 'Area Depan Lift Gedung Dua', 'area_lainnya', 'Gedung 2', NULL, 50, 'Area umum di depan lift, cocok untuk pameran kecil.', 1)
ON CONFLICT ("id") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Resource"', 'id'), COALESCE(max("id"), 1)) FROM "Resource";

-- 7. Resource Facilities
INSERT INTO "ResourceFacility" ("resourceId", "facilityId", "jumlah") VALUES
(1, 1, 20), (1, 2, 40), (1, 3, 1), (1, 5, 2), (1, 6, 1), (1, 8, 1),
(2, 1, 20), (2, 2, 40), (2, 3, 1), (2, 5, 2), (2, 6, 1), (2, 8, 1),
(3, 1, 1),  (3, 2, 15), (3, 3, 1), (3, 5, 1), (3, 8, 1),
(4, 2, 200),(4, 3, 1),  (4, 4, 1), (4, 5, 6), (4, 8, 1),
(5, 4, 1),
(6, 1, 4),  (6, 2, 50)
ON CONFLICT ("resourceId", "facilityId") DO NOTHING;

-- 8. Users (Password: Roomie123!)
-- Hash: $2b$10$yBAasknt.KP/7r5EBN2CY.5nhKchiC9P.kQSQdt9ZX6INqLclq.GC
INSERT INTO "User" ("id", "roleId", "unitId", "nama", "nimNip", "email", "noHp", "jabatan", "passwordHash", "isActive") VALUES
(1, 1, 1, 'Rani Putri', '202500001', 'mahasiswa@roomie.test', '0812-0000-0000', 'Ketua DPM', '$2b$10$yBAasknt.KP/7r5EBN2CY.5nhKchiC9P.kQSQdt9ZX6INqLclq.GC', 1),
(2, 2, 3, 'Bu Sari', '199800002', 'kemahasiswaan@roomie.test', '0812-0000-0000', 'Kabag Kemahasiswaan', '$2b$10$yBAasknt.KP/7r5EBN2CY.5nhKchiC9P.kQSQdt9ZX6INqLclq.GC', 1),
(3, 3, 4, 'Pak Budi', '199700003', 'ga@roomie.test', '0812-0000-0000', 'Kabag Umum', '$2b$10$yBAasknt.KP/7r5EBN2CY.5nhKchiC9P.kQSQdt9ZX6INqLclq.GC', 1),
(4, 4, 5, 'Pak Dimas', '199600004', 'satpam@roomie.test', '0812-0000-0000', 'Satpam', '$2b$10$yBAasknt.KP/7r5EBN2CY.5nhKchiC9P.kQSQdt9ZX6INqLclq.GC', 1),
(5, 5, 5, 'Admin ROOMIE', '199600005', 'admin@roomie.test', '0812-0000-0000', 'Administrator', '$2b$10$yBAasknt.KP/7r5EBN2CY.5nhKchiC9P.kQSQdt9ZX6INqLclq.GC', 1)
ON CONFLICT ("id") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE(max("id"), 1)) FROM "User";
