import { withApi } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = withApi(async (ctx) => {
  const rows = await db.notification.findMany({
    where: { userId: ctx.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return ctx.json({
    notifikasi: rows.map((n) => ({
      id: n.id,
      judul: n.judul,
      pesan: n.pesan,
      isRead: n.isRead === 1,
      bookingId: n.bookingId,
      createdAt: n.createdAt,
    })),
    unread: ctx.user!.unread,
  });
});

export const POST = withApi(async (ctx) => {
  // tandai semua terbaca
  await db.notification.updateMany({
    where: { userId: ctx.user!.id, isRead: 0 },
    data: { isRead: 1 },
  });
  return ctx.json({ ok: true });
});
