import { withApi } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const POST = withApi(async (ctx) => {
  await db.notification.updateMany({
    where: { userId: ctx.user!.id, isRead: 0 },
    data: { isRead: 1 },
  });
  return ctx.json({ ok: true });
});
