import { prisma } from "@kairo/database";
import type { UserRole } from "@kairo/database";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

async function setClerkRole(clerkUserId: string, role: string) {
  await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ public_metadata: { role } }),
  });
}

const VALID_ROLES: UserRole[] = ["VIEWER", "CHURCH_ADMIN", "SUPER_ADMIN"];

const bodySchema = z.object({
  role: z.enum(["VIEWER", "CHURCH_ADMIN", "SUPER_ADMIN"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  // Only SUPER_ADMIN can change roles
  const me = await prisma.user.findUnique({
    where: { clerkId: guard.userId },
    select: { role: true, id: true },
  });
  if (!me || me.role !== "SUPER_ADMIN") {
    return new Response("Only SUPER_ADMIN can change roles", { status: 403 });
  }

  // Can't change your own role
  if (me.id === params.id) {
    return new Response("Cannot change your own role", { status: 400 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return new Response("Invalid role", { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { role: body.role as UserRole },
    select: { id: true, name: true, email: true, role: true, clerkId: true },
  });

  await setClerkRole(updated.clerkId, updated.role);

  return Response.json(updated);
}
