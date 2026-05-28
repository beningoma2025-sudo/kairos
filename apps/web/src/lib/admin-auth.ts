import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";

export async function requireAdmin(): Promise<
  { ok: true; userId: string; dbUserId: string } | { ok: false; response: Response }
> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { ok: false, response: new Response("Unauthorized", { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  });

  if (!user || !["SUPER_ADMIN", "CHURCH_ADMIN"].includes(user.role)) {
    return { ok: false, response: new Response("Forbidden", { status: 403 }) };
  }

  return { ok: true, userId: clerkId, dbUserId: user.id };
}
