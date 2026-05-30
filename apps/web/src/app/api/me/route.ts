export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ isAdmin: false });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { role: true },
  });

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "CHURCH_ADMIN";
  return Response.json({ isAdmin });
}
