import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";
import { z } from "zod";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ data: [] });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return Response.json({ data: [] });

  const items = await prisma.watchlistItem.findMany({
    where: { userId: user.id },
    orderBy: { addedAt: "desc" },
    include: {
      content: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          thumbnailUrl: true,
          backdropUrl: true,
          duration: true,
          ageRating: true,
          viewCount: true,
          isFeatured: true,
          isKids: true,
          muxPlaybackId: true,
          publishedAt: true,
          tags: true,
          categories: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  return Response.json({ data: items.map((i) => ({ ...i.content, addedAt: i.addedAt })) });
}

const bodySchema = z.object({ contentId: z.string().min(1) });

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return new Response("Not found", { status: 404 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  await prisma.watchlistItem.upsert({
    where: { userId_contentId: { userId: user.id, contentId: body.contentId } },
    create: { userId: user.id, contentId: body.contentId },
    update: {},
  });

  return new Response(null, { status: 204 });
}
