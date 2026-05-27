import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@kairo/database";

export const liveRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/live — upcoming and currently live events
  fastify.get("/", async (_request, reply) => {
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

    return reply.send({ liveNow, upcoming });
  });

  // GET /api/live/:id
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const event = await prisma.liveEvent.findUnique({
      where: { id },
      include: {
        channel: {
          select: { id: true, name: true, logoUrl: true, slug: true, isVerified: true },
        },
      },
    });

    if (!event) {
      return reply.code(404).send({ error: "Live event not found" });
    }

    // Only expose stream key to channel admins — return limited data for viewers
    const { muxStreamKey: _streamKey, ...safeEvent } = event;

    return reply.send(safeEvent);
  });
};
