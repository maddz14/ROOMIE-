import { withApi, readJson } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { checkOut } from "@/lib/services/booking";

export const POST = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const kondisi = body.kondisi === "ada_kerusakan" ? "ada_kerusakan" : "baik";
    const catatanKerusakan =
      typeof body.catatanKerusakan === "string" ? body.catatanKerusakan.trim() : "";
    const catatanPetugas =
      typeof body.catatanPetugas === "string" ? body.catatanPetugas.trim() : "";
    const kunciDikembalikan = body.kunciDikembalikan === true;
    const perangkatDimatikan = body.perangkatDimatikan === true;

    await checkOut({
      bookingId: id,
      petugasId: ctx.user!.id,
      kondisi,
      catatanKerusakan: catatanKerusakan || undefined,
      kunciDikembalikan,
      perangkatDimatikan,
      catatanPetugas: catatanPetugas || undefined,
    });
    return ctx.json({ ok: true });
  },
  { roles: ["satpam"] },
);
