import { withApi } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { checkIn } from "@/lib/services/booking";

export const POST = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
    await checkIn({ bookingId: id, petugasId: ctx.user!.id });
    return ctx.json({ ok: true });
  },
  { roles: ["satpam"] },
);
