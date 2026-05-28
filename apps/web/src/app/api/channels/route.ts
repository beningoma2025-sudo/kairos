import { prisma } from "@kairo/database";

export async function GET() {
  const channels = await prisma.channel.findMany({
    where: { isVerified: true },
    orderBy: { subscriberCount: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      bannerUrl: true,
      denomination: true,
      subscriberCount: true,
      isVerified: true,
    },
  });

  return Response.json(channels, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
  });
}
