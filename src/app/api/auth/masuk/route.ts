import { withApi, readJson, asString } from "@/lib/api-handler";
import { ERR } from "@/lib/errors";
import {
  createSession,
  verifyPassword,
  checkLoginThrottle,
  recordLoginFailure,
  clearLoginFailure,
} from "@/lib/auth";
import { db } from "@/lib/db";

export const POST = withApi(
  async (ctx) => {
    const body = (await readJson(ctx.req)) as Record<string, unknown>;
    const email = asString(body.email, "email").trim().toLowerCase();
    const password = asString(body.password, "password");

    checkLoginThrottle(email);

    const user = await db.user.findUnique({
      where: { email },
      include: { role: true, unit: true },
    });

    if (!user || user.isActive !== 1) {
      recordLoginFailure(email);
      throw ERR.LOGIN_GAGAL();
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      recordLoginFailure(email);
      throw ERR.LOGIN_GAGAL();
    }

    clearLoginFailure(email);
    const { cookie } = await createSession(user.id);
    ctx.setCookie(cookie);

    const unread = await db.notification.count({
      where: { userId: user.id, isRead: 0 },
    });
    return ctx.json({
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        nimNip: user.nimNip,
        noHp: user.noHp,
        jabatan: user.jabatan,
        roleNama: user.role.nama,
        unitId: user.unitId,
        unitNama: user.unit?.nama ?? null,
        isActive: user.isActive,
        unread,
      },
    });
  },
  { public: true },
);
