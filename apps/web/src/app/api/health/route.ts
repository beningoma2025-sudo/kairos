export const dynamic = "force-dynamic";

import { prisma } from "@kairo/database";

export async function GET() {
  const result: Record<string, unknown> = { ok: true, ts: new Date().toISOString() };

  try {
    const count = await prisma.user.count();
    result.db = "ok";
    result.userCount = count;
  } catch (e) {
    result.db = "error";
    result.dbError = String(e);
  }

  return Response.json(result);
}
