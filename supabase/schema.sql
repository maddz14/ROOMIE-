-- ==============================================================================
-- ROOMIE - Sistem Manajemen Peminjaman Ruang & Lapangan Kampus
-- Supabase (PostgreSQL) Database Schema
-- ==============================================================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS "Role" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Unit" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" TEXT NOT NULL DEFAULT 'lainnya',
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "unitId" INTEGER,
    "nama" TEXT NOT NULL,
    "nimNip" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "noHp" TEXT,
    "jabatan" TEXT,
    "passwordHash" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Resource" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "gedung" TEXT,
    "lantai" TEXT,
    "kapasitas" INTEGER NOT NULL DEFAULT 0,
    "deskripsi" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Facility" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "satuan" TEXT NOT NULL DEFAULT 'unit',
    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ResourceFacility" (
    "resourceId" INTEGER NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ResourceFacility_pkey" PRIMARY KEY ("resourceId","facilityId")
);

CREATE TABLE IF NOT EXISTS "Holiday" (
    "tanggal" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("tanggal")
);

CREATE TABLE IF NOT EXISTS "Setting" (
    "kunci" TEXT NOT NULL,
    "nilai" TEXT NOT NULL,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("kunci")
);

CREATE TABLE IF NOT EXISTS "Booking" (
    "id" SERIAL NOT NULL,
    "kodeBooking" TEXT,
    "pemohonId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "judulKegiatan" TEXT NOT NULL,
    "jenisKegiatan" TEXT NOT NULL,
    "jumlahPeserta" INTEGER NOT NULL,
    "penanggungJawab" TEXT NOT NULL,
    "tanggal" TEXT NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "sifatPenggunaan" TEXT NOT NULL DEFAULT 'sekali_pakai',
    "diLuarJamKerja" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'menunggu_kemahasiswaan',
    "ketentuanDisetujuiAt" TIMESTAMP(3),
    "alasanPembatalan" TEXT,
    "catatanPemohon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BookingFacility" (
    "bookingId" INTEGER NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    "keterangan" TEXT,
    CONSTRAINT "BookingFacility_pkey" PRIMARY KEY ("bookingId","facilityId")
);

CREATE TABLE IF NOT EXISTS "BookingDocument" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "namaFile" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mime" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BookingApproval" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "tahap" INTEGER NOT NULL,
    "approverId" INTEGER,
    "keputusan" TEXT NOT NULL DEFAULT 'menunggu',
    "alasan" TEXT,
    "decidedAt" TIMESTAMP(3),
    CONSTRAINT "BookingApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UsageLog" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "petugasId" INTEGER NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "kondisi" TEXT,
    "catatanKerusakan" TEXT,
    "kunciDikembalikan" INTEGER,
    "perangkatDimatikan" INTEGER,
    "catatanPetugas" TEXT,
    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bookingId" INTEGER,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "isRead" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "aksi" TEXT NOT NULL,
    "tabel" TEXT NOT NULL,
    "recordId" INTEGER,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- 2. Indexes & Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Role_nama_key" ON "Role"("nama");
CREATE UNIQUE INDEX IF NOT EXISTS "User_nimNip_key" ON "User"("nimNip");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_roleId_idx" ON "User"("roleId");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");

CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Resource_kode_key" ON "Resource"("kode");
CREATE INDEX IF NOT EXISTS "Resource_tipe_idx" ON "Resource"("tipe");
CREATE INDEX IF NOT EXISTS "Resource_isActive_idx" ON "Resource"("isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "Facility_nama_key" ON "Facility"("nama");
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_kodeBooking_key" ON "Booking"("kodeBooking");
CREATE INDEX IF NOT EXISTS "Booking_resourceId_tanggal_jamMulai_jamSelesai_idx" ON "Booking"("resourceId", "tanggal", "jamMulai", "jamSelesai");
CREATE INDEX IF NOT EXISTS "Booking_status_tanggal_idx" ON "Booking"("status", "tanggal");
CREATE INDEX IF NOT EXISTS "Booking_pemohonId_createdAt_idx" ON "Booking"("pemohonId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "BookingApproval_bookingId_tahap_key" ON "BookingApproval"("bookingId", "tahap");
CREATE UNIQUE INDEX IF NOT EXISTS "UsageLog_bookingId_key" ON "UsageLog"("bookingId");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "AuditLog_aksi_idx" ON "AuditLog"("aksi");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- 3. Foreign Key Constraints
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_roleId_fkey') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_unitId_fkey') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Session_userId_fkey') THEN
        ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ResourceFacility_resourceId_fkey') THEN
        ALTER TABLE "ResourceFacility" ADD CONSTRAINT "ResourceFacility_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ResourceFacility_facilityId_fkey') THEN
        ALTER TABLE "ResourceFacility" ADD CONSTRAINT "ResourceFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_pemohonId_fkey') THEN
        ALTER TABLE "Booking" ADD CONSTRAINT "Booking_pemohonId_fkey" FOREIGN KEY ("pemohonId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_resourceId_fkey') THEN
        ALTER TABLE "Booking" ADD CONSTRAINT "Booking_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BookingFacility_bookingId_fkey') THEN
        ALTER TABLE "BookingFacility" ADD CONSTRAINT "BookingFacility_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BookingFacility_facilityId_fkey') THEN
        ALTER TABLE "BookingFacility" ADD CONSTRAINT "BookingFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BookingDocument_bookingId_fkey') THEN
        ALTER TABLE "BookingDocument" ADD CONSTRAINT "BookingDocument_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BookingApproval_bookingId_fkey') THEN
        ALTER TABLE "BookingApproval" ADD CONSTRAINT "BookingApproval_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BookingApproval_approverId_fkey') THEN
        ALTER TABLE "BookingApproval" ADD CONSTRAINT "BookingApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UsageLog_bookingId_fkey') THEN
        ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UsageLog_petugasId_fkey') THEN
        ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_bookingId_fkey') THEN
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_userId_fkey') THEN
        ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
