import { withApi, readJson } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { loadSettings, saveSetting } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/rules";

export const GET = withApi(
  async (ctx) => {
    return ctx.json({ pengaturan: await loadSettings() });
  },
  { roles: ["admin"] },
);

export const PUT = withApi(
  async (ctx) => {
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const fields: Record<string, string> = {};

    const jamMulai = typeof body.jam_kerja_mulai === "string" ? body.jam_kerja_mulai : undefined;
    const jamSelesai = typeof body.jam_kerja_selesai === "string" ? body.jam_kerja_selesai : undefined;
    const minAju = typeof body.min_hari_kerja_pengajuan === "number" ? body.min_hari_kerja_pengajuan : undefined;
    const minBatal = typeof body.min_hari_pembatalan === "number" ? body.min_hari_pembatalan : undefined;
    const hariKerja = typeof body.hari_kerja === "string" ? body.hari_kerja : undefined;

    if (jamMulai !== undefined && !/^\d{2}:\d{2}$/.test(jamMulai))
      fields.jam_kerja_mulai = "Format jam tidak valid (HH:MM).";
    if (jamSelesai !== undefined && !/^\d{2}:\d{2}$/.test(jamSelesai))
      fields.jam_kerja_selesai = "Format jam tidak valid (HH:MM).";
    if (jamMulai && jamSelesai && jamSelesai <= jamMulai)
      fields.jam_kerja_selesai = "Jam selesai harus setelah jam mulai.";
    if (minAju !== undefined && minAju < 0)
      fields.min_hari_kerja_pengajuan = "Tidak boleh negatif.";
    if (minBatal !== undefined && minBatal < 0)
      fields.min_hari_pembatalan = "Tidak boleh negatif.";
    if (hariKerja !== undefined) {
      const parts = hariKerja.split(",").map((s) => parseInt(s.trim(), 10));
      if (parts.some((n) => !Number.isFinite(n) || n < 1 || n > 7))
        fields.hari_kerja = "Hari kerja tidak valid (1..7 dipisah koma).";
    }
    if (Object.keys(fields).length > 0) throw ERR.INPUT_TIDAK_VALID(fields);

    if (jamMulai) await saveSetting("jam_kerja_mulai", jamMulai);
    if (jamSelesai) await saveSetting("jam_kerja_selesai", jamSelesai);
    if (minAju !== undefined) await saveSetting("min_hari_kerja_pengajuan", String(minAju));
    if (minBatal !== undefined) await saveSetting("min_hari_pembatalan", String(minBatal));
    if (hariKerja) await saveSetting("hari_kerja", hariKerja);

    await db.auditLog.create({
      data: { userId: ctx.user!.id, aksi: "ubah_pengaturan", tabel: "settings", recordId: 0, detail: "update" },
    });
    return ctx.json({ pengaturan: await loadSettings() });
  },
  { roles: ["admin"] },
);
