import { withApi, readJson, asString } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { batalkan } from "@/lib/services/booking";

export const POST = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const alasan = asString(body.alasan, "alasan").trim();
    if (alasan.length < 3)
      throw ERR.INPUT_TIDAK_VALID({
        alasan: "Tuliskan alasan pembatalan singkat.",
      });
    const res = await batalkan({ bookingId: id, userId: ctx.user!.id, alasan });
    return ctx.json({ ok: true, status: res.status });
  },
  { roles: ["peminjam"] },
);
