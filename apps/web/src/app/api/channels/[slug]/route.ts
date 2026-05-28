import { prisma } from "@kairo/database";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const channel = await prisma.channel.findUnique({
    where: { slug: params.slug },
    include: {
      content: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          type: true,
          thumbnailUrl: true,
          duration: true,
          viewCount: true,
          publishedAt: true,
        },
      },
      liveEvents: {
        where: { status: { in: ["LIVE", "SCHEDULED"] } },
        orderBy: { scheduledStartAt: "asc" },
        take: 5,
      },
    },
  });

  if (!channel) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(channel);
}
