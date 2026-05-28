import { prisma } from "@kairo/database";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const content = await prisma.content.findUnique({
    where: { id: params.id, status: "PUBLISHED" },
    include: {
      categories: true,
      channel: {
        select: { id: true, name: true, slug: true, logoUrl: true, isVerified: true },
      },
      series: {
        select: { id: true, title: true, totalSeasons: true },
      },
    },
  });

  if (!content) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Increment view count (fire and forget)
  void prisma.content.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } },
  });

  return Response.json(content, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}
