import { withApi } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { buildFilter } from "../ringkasan/route";
import { labelJenis } from "@/lib/serialize";
import { STATUS_LABEL } from "@/lib/rules";
import { formatWaktu } from "@/lib/wib";

export const GET = withApi(
  async (ctx) => {
    const where = await buildFilter(ctx);
    const rows = await db.booking.findMany({
      where,
      orderBy: { tanggal: "desc" },
      include: {
        resource: true,
        pemohon: { include: { unit: true } },
        usageLog: true,
      },
    });

    const header = [
      "Kode Booking",
      "Tanggal",
      "Ruang",
      "Pemohon",
      "Unit",
      "Kegiatan",
      "Jenis",
      "Peserta",
      "Jam Mulai",
      "Jam Selesai",
      "Status",
      "Jam Masuk",
      "Jam Keluar",
      "Kondisi",
    ];

    const lines = [header.join(",")];
    for (const r of rows) {
      const row = [
        r.kodeBooking ?? "",
        r.tanggal,
        `"${(r.resource?.nama ?? "").replace(/"/g, '""')}"`,
        `"${(r.pemohon?.nama ?? "").replace(/"/g, '""')}"`,
        `"${(r.pemohon?.unit?.nama ?? "").replace(/"/g, '""')}"`,
        `"${r.judulKegiatan.replace(/"/g, '""')}"`,
        labelJenis(r.jenisKegiatan),
        String(r.jumlahPeserta),
        r.jamMulai,
        r.jamSelesai,
        STATUS_LABEL[r.status] ?? r.status,
        r.usageLog?.checkInAt ? formatWaktu(r.usageLog.checkInAt) : "",
        r.usageLog?.checkOutAt ? formatWaktu(r.usageLog.checkOutAt) : "",
        r.usageLog?.kondisi ?? "",
      ];
      lines.push(row.join(","));
    }

    const csv = "\uFEFF" + lines.join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-roomie.csv"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
  { roles: ["kemahasiswaan", "ga", "admin"] },
);
