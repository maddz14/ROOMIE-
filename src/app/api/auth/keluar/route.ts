import { withApi } from "@/lib/api-handler";
import { destroySession, readSid } from "@/lib/auth";

export const POST = withApi(
  async (ctx) => {
    const sid = readSid(ctx.req);
    if (sid) await destroySession(sid);
    ctx.setCookie(
      "roomie_sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    );
    return ctx.json({ ok: true });
  },
  { public: true },
);
