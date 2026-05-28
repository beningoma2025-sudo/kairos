import { prisma } from "@kairo/database";

export async function GET() {
  const [liveNow, upcoming] = await Promise.all([
    prisma.liveEvent.findMany({
      where: { status: "LIVE" },
      orderBy: { actualStartAt: "asc" },
      include: {
        channel: { select: { name: true, logoUrl: true, slug: true } },
      },
    }),
    prisma.liveEvent.findMany({
      where: {
        status: "SCHEDULED",
        scheduledStartAt: { gte: new Date() },
      },
      orderBy: { scheduledStartAt: "asc" },
      take: 10,
      include: {
        channel: { select: { name: true, logoUrl: true, slug: true } },
      },
    }),
  ]);

  return Response.json(
    { liveNow, upcoming },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
  );
}
