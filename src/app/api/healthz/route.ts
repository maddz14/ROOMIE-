import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  await ensureSeeded().catch(() => {});
  return Response.json({ status: "ok" });
}
