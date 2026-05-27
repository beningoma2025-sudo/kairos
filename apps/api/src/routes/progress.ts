import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@kairo/database";

const progressSchema = z.object({
  contentId: z.string().min(1),
  progressSeconds: z.number().int().min(0),
  completed: z.boolean().default(false),
});

export const progressRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/progress
  fastify.post("/", async (request, reply) => {
    const userId = (request as typeof request & { userId?: string }).userId;
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const body = progressSchema.parse(request.body);

    await prisma.watchHistory.upsert({
      where: { userId_contentId: { userId, contentId: body.contentId } },
      update: {
        progressSeconds: body.progressSeconds,
        watchedAt: new Date(),
        ...(body.completed && { completedAt: new Date() }),
      },
      create: {
        userId,
        contentId: body.contentId,
        progressSeconds: body.progressSeconds,
        watchedAt: new Date(),
        ...(body.completed && { completedAt: new Date() }),
      },
    });

    return reply.code(204).send();
  });
};
