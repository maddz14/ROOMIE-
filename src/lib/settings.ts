// Pemuat pengaturan & hari libur dari DB, dengan default PRD.

import { db } from "./db";
import { DEFAULT_SETTINGS, type Settings } from "./rules";

export async function loadSettings(): Promise<Settings> {
  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.kunci, r.nilai]));
  return {
    jam_kerja_mulai: map.get("jam_kerja_mulai") ?? DEFAULT_SETTINGS.jam_kerja_mulai,
    jam_kerja_selesai:
      map.get("jam_kerja_selesai") ?? DEFAULT_SETTINGS.jam_kerja_selesai,
    min_hari_kerja_pengajuan: parseInt(
      map.get("min_hari_kerja_pengajuan") ??
        String(DEFAULT_SETTINGS.min_hari_kerja_pengajuan),
      10,
    ),
    min_hari_pembatalan: parseInt(
      map.get("min_hari_pembatalan") ??
        String(DEFAULT_SETTINGS.min_hari_pembatalan),
      10,
    ),
    hari_kerja: map.get("hari_kerja") ?? DEFAULT_SETTINGS.hari_kerja,
  };
}

export async function loadLibur(): Promise<Set<string>> {
  const rows = await db.holiday.findMany();
  return new Set(rows.map((r) => r.tanggal));
}

export async function saveSetting(kunci: string, nilai: string): Promise<void> {
  await db.setting.upsert({
    where: { kunci },
    update: { nilai },
    create: { kunci, nilai },
  });
}
