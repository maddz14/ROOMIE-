import { withApi, readJson, asString } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { putuskan } from "@/lib/services/booking";

export const POST = withApi(
  async (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const keputusan = asString(body.keputusan, "keputusan");
    if (keputusan !== "disetujui" && keputusan !== "ditolak") {
      throw ERR.INPUT_TIDAK_VALID({ keputusan: "Keputusan tidak valid." });
    }
    const alasan = typeof body.alasan === "string" ? body.alasan.trim() : "";
    const res = await putuskan({
      bookingId: id,
      approverId: ctx.user!.id,
      roleNama: ctx.user!.roleNama,
      keputusan,
      alasan: alasan || undefined,
    });
    return ctx.json({ ok: true, status: res.status });
  },
  { roles: ["kemahasiswaan", "ga"] },
);
