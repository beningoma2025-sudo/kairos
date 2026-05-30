export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.notification.updateMany({
    where: { id: params.id, userId: user.id },
    data: { read: true },
  });

  return Response.json({ ok: true });
}
