import { withApi, readJson, asString, asInt } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { ajukan } from "@/lib/services/booking";
import { serializeBooking } from "@/lib/serialize";

const JENIS_VALID = [
  "perkuliahan",
  "ujian",
  "rapat_internal",
  "seminar_workshop",
  "kegiatan_kemahasiswaan",
  "tamu_eksternal",
  "lainnya",
];

export const GET = withApi(
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const status = url.searchParams.get("status") || "";
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";

    const where: any = { pemohonId: ctx.user!.id };
    if (status && status !== "semua") {
      if (status === "berjalan") {
        where.status = { in: ["menunggu_kemahasiswaan", "menunggu_ga", "disetujui", "berlangsung"] };
      } else if (status === "ditolak_dibatalkan") {
        where.status = { in: ["ditolak", "dibatalkan"] };
      } else {
        where.status = status;
      }
    }
    if (q) {
      where.OR = [
        { judulKegiatan: { contains: q } },
        { kodeBooking: { contains: q } },
      ];
    }

    const rows = await db.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        resource: true,
        pemohon: { include: { unit: true } },
      },
    });
    return ctx.json({ bookings: rows.map((b) => serializeBooking(b as any, ctx.user)) });
  },
  { roles: ["peminjam"] },
);

export const POST = withApi(
  async (ctx) => {
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const resourceId = asInt(body.resourceId, "resourceId");
    const judulKegiatan = asString(body.judulKegiatan, "judulKegiatan").trim();
    const jenisKegiatan = asString(body.jenisKegiatan, "jenisKegiatan");
    const jumlahPeserta = asInt(body.jumlahPeserta, "jumlahPeserta");
    const penanggungJawab = asString(body.penanggungJawab, "penanggungJawab").trim();
    const tanggal = asString(body.tanggal, "tanggal");
    const jamMulai = asString(body.jamMulai, "jamMulai");
    const jamSelesai = asString(body.jamSelesai, "jamSelesai");
    const sifatPenggunaan =
      typeof body.sifatPenggunaan === "string" ? body.sifatPenggunaan : "sekali_pakai";
    const catatanPemohon =
      typeof body.catatanPemohon === "string" ? body.catatanPemohon.trim() : null;
    const fasilitasRaw = Array.isArray(body.fasilitas) ? body.fasilitas : [];
    const setujuKetentuan = body.setujuKetentuan === true;

    const fields: Record<string, string> = {};
    if (judulKegiatan.length < 3)
      fields.judulKegiatan = "Judul kegiatan minimal 3 karakter.";
    if (!JENIS_VALID.includes(jenisKegiatan))
      fields.jenisKegiatan = "Jenis kegiatan tidak valid.";
    if (jumlahPeserta <= 0)
      fields.jumlahPeserta = "Jumlah peserta harus lebih dari 0.";
    if (penanggungJawab.length < 2)
      fields.penanggungJawab = "Penanggung jawab minimal 2 karakter.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal))
      fields.tanggal = "Format tanggal tidak valid (YYYY-MM-DD).";
    if (!/^\d{2}:\d{2}$/.test(jamMulai) || !/^\d{2}:\d{2}$/.test(jamSelesai))
      fields.jamMulai = "Format jam tidak valid (HH:MM).";
    if (Object.keys(fields).length > 0) throw ERR.INPUT_TIDAK_VALID(fields);

    const fasilitas: { facilityId: number; jumlah: number; keterangan?: string }[] = [];
    for (const f of fasilitasRaw as any[]) {
      if (!f || typeof f.facilityId === "undefined") continue;
      fasilitas.push({
        facilityId: parseInt(f.facilityId, 10),
        jumlah: parseInt(f.jumlah, 10) || 1,
        keterangan: typeof f.keterangan === "string" ? f.keterangan : undefined,
      });
    }

    const created = await ajukan({
      userId: ctx.user!.id,
      resourceId,
      judulKegiatan,
      jenisKegiatan,
      jumlahPeserta,
      penanggungJawab,
      tanggal,
      jamMulai,
      jamSelesai,
      sifatPenggunaan,
      catatanPemohon,
      fasilitas,
      setujuKetentuan,
    });

    const full = await db.booking.findUnique({
      where: { id: created.id },
      include: {
        resource: true,
        pemohon: { include: { unit: true } },
        approvals: { include: { approver: true } },
        facilities: { include: { facility: true } },
        documents: true,
        usageLog: { include: { petugas: true } },
      },
    });
    return ctx.json({ booking: serializeBooking(full as any, ctx.user) }, 201);
  },
  { roles: ["peminjam"] },
);
