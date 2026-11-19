// Instrumentasi Next.js — dijalankan sekali saat server start.
// Memuat data demo ROOMIE (PRD Bagian 11) bila database masih kosong.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSeeded } = await import("@/lib/seed");
    await ensureSeeded().catch((e) => {
      console.error("[instrumentation] seed gagal:", e);
    });
  }
}
