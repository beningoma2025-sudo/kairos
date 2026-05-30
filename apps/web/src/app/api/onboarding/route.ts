export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["individual", "family"]).optional(),
  denomination: z.string().max(100).optional(),
  spiritualMaturity: z.enum(["new_believer", "growing", "mature"]).optional(),
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      denomination: body.denomination ?? null,
      spiritualMaturity: body.spiritualMaturity ?? null,
    },
    update: {
      ...(body.denomination !== undefined && { denomination: body.denomination }),
      ...(body.spiritualMaturity !== undefined && { spiritualMaturity: body.spiritualMaturity }),
    },
  });

  // Welcome notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "system",
      title: "Welcome to Kairo ✦",
      body: "Your faith journey starts now. Explore thousands of sermons, documentaries, and teachings.",
      link: "/browse",
    },
  });

  return Response.json({ ok: true });
}
