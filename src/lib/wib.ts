// Helper zona waktu Asia/Jakarta (WIB). Semua tanggal & jam dihitung dalam WIB,
// tidak bergantung pada zona waktu server.

const WIB = "Asia/Jakarta";

/** Tanggal hari ini dalam format YYYY-MM-DD (WIB). */
export function tanggalHariIniWIB(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Waktu sekarang dalam format HH:MM (WIB). */
export function jamSekarangWIB(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** Timestamp ISO berbasis WIB untuk kolom audit / log. */
export function nowWIBISO(): string {
  // UTC ISO dengan offset WIB (+07:00)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}+07:00`;
}

/** Hari dalam minggu (1=Senin .. 7=Minggu) untuk tanggal YYYY-MM-DD. */
export function hariMingguISO(tanggal: string): number {
  // tanggal diasumsikan sudah YYYY-MM-DD yang merepresentasikan hari WIB
  const d = new Date(tanggal + "T12:00:00+07:00");
  const js = d.getUTCDay(); // 0=Min .. 6=Sab (UTC karena kita pakai offset konstan)
  // konversi: 0(Min)->7, 1(Sen)->1, ... 6(Sab)->6
  return js === 0 ? 7 : js;
}

/** Tambah n hari kalender ke tanggal YYYY-MM-DD. */
export function tambahHariKalender(tanggal: string, n: number): string {
  const d = new Date(tanggal + "T12:00:00+07:00");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Format Date menjadi teks tanggal ramah (mis. "Senin, 3 Mar 2026") dalam WIB. */
export function formatTanggalPanjang(tanggal: string): string {
  const d = new Date(tanggal + "T12:00:00+07:00");
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTanggalPendek(tanggal: string): string {
  const d = new Date(tanggal + "T12:00:00+07:00");
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatWaktu(iso: string | Date | null): string {
  if (!iso) return "-";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export { WIB };
