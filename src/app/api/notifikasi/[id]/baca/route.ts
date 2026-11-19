import { withApi } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import { db } from "@/lib/db";

export const POST = withApi(async (ctx) => {
  const id = parseInt(ctx.params.id, 10);
  if (!Number.isFinite(id)) throw ERR.TIDAK_DITEMUKAN();
  const n = await db.notification.findUnique({ where: { id } });
  if (!n || n.userId !== ctx.user!.id) throw ERR.TIDAK_DITEMUKAN();
  if (n.isRead !== 1) {
    await db.notification.update({ where: { id }, data: { isRead: 1 } });
  }
  return ctx.json({ ok: true });
});
