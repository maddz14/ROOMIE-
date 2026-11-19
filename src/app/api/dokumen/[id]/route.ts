import { withApi, readJson } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";

export const GET = withApi(async (ctx) => {
  const id = parseInt(ctx.params.id, 10);
  if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
  const doc = await db.bookingDocument.findUnique({
    where: { id },
    include: { booking: { select: { pemohonId: true } } },
  });
  if (!doc) throw ERR.TIDAK_DITEMUKAN("Dokumen tidak ditemukan.");

  const role = ctx.user!.roleNama;
  const boleh =
    doc.booking.pemohonId === ctx.user!.id ||
    role === "kemahasiswaan" ||
    role === "ga" ||
    role === "admin";
  if (!boleh) throw ERR.TIDAK_BERWENANG();

  const filepath = path.join(process.cwd(), "data", "uploads", doc.path);
  let buf: Buffer;
  try {
    buf = await readFile(filepath);
  } catch {
    throw ERR.TIDAK_DITEMUKAN("Berkas tidak tersedia di server.");
  }
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": doc.mime || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.namaFile)}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
});
