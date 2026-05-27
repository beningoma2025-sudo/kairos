import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@kairo/database";

export const channelRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/channels
  fastify.get("/", async (_request, reply) => {
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

    return reply.send(channels);
  });

  // GET /api/channels/:slug
  fastify.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const channel = await prisma.channel.findUnique({
      where: { slug },
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
      return reply.code(404).send({ error: "Channel not found" });
    }

    return reply.send(channel);
  });
};
