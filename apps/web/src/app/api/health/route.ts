export const dynamic = "force-dynamic";

import { existsSync, readdirSync } from "fs";
import { prisma } from "@kairo/database";

export async function GET() {
  const result: Record<string, unknown> = { ok: true, ts: new Date().toISOString() };

  // Check what files exist in key directories
  const paths = [
    "/var/task/apps/web/.prisma/client",
    "/var/task/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client",
    "/var/task/apps/web/.next/server",
  ];

  result.paths = {};
  for (const p of paths) {
    if (existsSync(p)) {
      try {
        (result.paths as Record<string, unknown>)[p] = readdirSync(p).filter(f => f.endsWith(".node") || f.endsWith(".js")).slice(0, 5);
      } catch {
        (result.paths as Record<string, unknown>)[p] = "exists_but_cant_read";
      }
    } else {
      (result.paths as Record<string, unknown>)[p] = "not_found";
    }
  }

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
