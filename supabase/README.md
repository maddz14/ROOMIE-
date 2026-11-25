# Panduan Menghubungkan Supabase dengan ROOMIE

Aplikasi **ROOMIE** kini 100% siap dijalankan dengan **Supabase** (PostgreSQL) untuk deployment cloud (Vercel / Railway / VPS / Coolify) maupun lokal.

---

## Langkah Cepat (2 Menit)

### 1. Buat Proyek di Supabase
1. Buka [https://supabase.com](https://supabase.com) dan login.
2. Klik **New Project**, beri nama proyek (misal: `roomie-cwe`).
3. Tentukan database password yang kuat dan simpan password tersebut.

### 2. Jalankan Skrip Database (SQL Editor)
Di dashboard Supabase:
1. Masuk ke menu **SQL Editor** (ikon terminal di sidebar kiri).
2. Buat query baru, buka file [`supabase/schema.sql`](./schema.sql), salin seluruh isinya lalu klik **Run**.
3. Buat query baru lagi, buka file [`supabase/seed.sql`](./seed.sql), salin seluruh isinya lalu klik **Run** untuk memasukkan data awal master & akun demo.

> **Alternatif via Prisma CLI:**
> Jika Anda sudah mengisi `.env`, cukup jalankan:
> ```bash
> npm run db:push:postgres
> ```

---

### 3. Konfigurasi Environment Variable (`.env`)
Di Supabase Dashboard:
1. Buka **Project Settings** > **Database** > **Connection string**.
2. Pilih mode **URI** (atau **Transaction Pooler** jika deploy ke Vercel/serverless).
3. Salin connection string tersebut ke file `.env` proyek:

```env
# URL Database Supabase (Port 6543 untuk Transaction Pooler Vercel, atau 5432 untuk direct connection)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# DIRECT_URL (Digunakan untuk migrasi / DDL)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

---

### 4. Switch Prisma Client ke PostgreSQL
Ketika beralih ke Supabase:
```bash
# 1. Generate client khusus PostgreSQL
npx prisma generate --schema=prisma/schema.postgresql.prisma

# 2. Push skema (opsional jika sudah run SQL di Supabase editor)
npx prisma db push --schema=prisma/schema.postgresql.prisma
```

---

## Akun Demo Default (Tersedia Otomatis setelah Seed)
Password untuk semua akun: **`Roomie123!`**
- **Peminjam (Mahasiswa / HP Mode)**: `mahasiswa@roomie.test`
- **Kemahasiswaan (Approver Tahap 1)**: `kemahasiswaan@roomie.test`
- **GA / Sarpras (Approver Tahap 2)**: `ga@roomie.test`
- **Satpam (Keamanan & Check-in)**: `satpam@roomie.test`
- **Administrator**: `admin@roomie.test`
