import { withApi } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

export const POST = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();

    const booking = await db.booking.findUnique({
      where: { id },
      select: { pemohonId: true },
    });
    if (!booking) throw ERR.TIDAK_DITEMUKAN("Pengajuan tidak ditemukan.");
    if (booking.pemohonId !== ctx.user!.id) throw ERR.TIDAK_BERWENANG();

    const form = await ctx.req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw ERR.INPUT_TIDAK_VALID({ file: "Berkas wajib diunggah." });
    }
    if (file.size > MAX_BYTES) {
      throw ERR.BERKAS_TIDAK_VALID("Berkas melebihi 2 MB.");
    }
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const mime = file.type || "";
    const okMime = ALLOWED.includes(mime);
    const okExt = ["pdf", "jpg", "jpeg", "png"].includes(ext);
    if (!okMime && !okExt) {
      throw ERR.BERKAS_TIDAK_VALID("Hanya PDF, JPG, atau PNG yang diizinkan.");
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const random = randomBytes(12).toString("hex");
    const filename = `${random}.${ext || "bin"}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buf);

    const doc = await db.bookingDocument.create({
      data: {
        bookingId: id,
        namaFile: file.name,
        path: filename,
        mime: mime || null,
      },
    });
    return ctx.json({ dokumen: { id: doc.id, namaFile: doc.namaFile, uploadedAt: doc.uploadedAt } }, 201);
  },
  { roles: ["peminjam"] },
);
