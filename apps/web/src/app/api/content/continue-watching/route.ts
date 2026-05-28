import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ data: [] });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return Response.json({ data: [] });

  const history = await prisma.watchHistory.findMany({
    where: {
      userId: user.id,
      completedAt: null, // only in-progress content
      progressSeconds: { gt: 30 },
    },
    orderBy: { watchedAt: "desc" },
    take: 12,
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

  const data = history.map((h) => ({
    ...h.content,
    progressSeconds: h.progressSeconds,
  }));

  return Response.json({ data });
}
