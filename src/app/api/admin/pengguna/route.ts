import { withApi } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = withApi(
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const where: any = {};
    if (q) {
      where.OR = [
        { nama: { contains: q } },
        { email: { contains: q } },
        { nimNip: { contains: q } },
      ];
    }
    const rows = await db.user.findMany({
      where,
      orderBy: { nama: "asc" },
      include: { role: true, unit: true },
    });
    return ctx.json({
      pengguna: rows.map((u) => ({
        id: u.id,
        nama: u.nama,
        nimNip: u.nimNip,
        email: u.email,
        noHp: u.noHp,
        jabatan: u.jabatan,
        roleNama: u.role.nama,
        roleId: u.roleId,
        unitNama: u.unit?.nama ?? null,
        unitId: u.unitId,
        isActive: u.isActive === 1,
        createdAt: u.createdAt,
      })),
    });
  },
  { roles: ["admin"] },
);
