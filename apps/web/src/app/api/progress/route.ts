import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";
import { z } from "zod";

const bodySchema = z.object({
  contentId: z.string().min(1),
  progressSeconds: z.number().int().min(0),
  completed: z.boolean().default(false),
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  await prisma.watchHistory.upsert({
    where: { userId_contentId: { userId: user.id, contentId: body.contentId } },
    update: {
      progressSeconds: body.progressSeconds,
      watchedAt: new Date(),
      ...(body.completed && { completedAt: new Date() }),
    },
    create: {
      userId: user.id,
      contentId: body.contentId,
      progressSeconds: body.progressSeconds,
      ...(body.completed && { completedAt: new Date() }),
    },
  });

  return new Response(null, { status: 204 });
}
