import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@kairo/database";
import type { ContentStatus, ContentType } from "@kairo/database";

const querySchema = z.object({
  type: z.enum(["movie", "series", "episode", "documentary", "teaching", "kids", "live_event", "short"]).optional(),
  featured: z.coerce.boolean().optional(),
  kids: z.coerce.boolean().optional(),
  channelId: z.string().optional(),
  seriesId: z.string().optional(),
  sort: z.enum(["newest", "popular", "trending"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
});

export const contentRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/content
  fastify.get("/", async (request, reply) => {
    const query = querySchema.parse(request.query);

    const where = {
      status: "PUBLISHED" as ContentStatus,
      ...(query.type && { type: query.type.toUpperCase() as ContentType }),
      ...(query.featured !== undefined && { isFeatured: query.featured }),
      ...(query.kids !== undefined && { isKids: query.kids }),
      ...(query.channelId && { channelId: query.channelId }),
      ...(query.seriesId && { seriesId: query.seriesId }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" as const } },
          { description: { contains: query.search, mode: "insensitive" as const } },
          { tags: { has: query.search.toLowerCase() } },
        ],
      }),
    };

    const orderBy =
      query.sort === "popular"
        ? { viewCount: "desc" as const }
        : query.sort === "trending"
          ? { likeCount: "desc" as const }
          : { publishedAt: "desc" as const };

    const [data, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
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
          categories: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.content.count({ where }),
    ]);

    return reply.send({
      data,
      pagination: {
        page: query.page,
        pageSize: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNextPage: query.page * query.limit < total,
        hasPrevPage: query.page > 1,
      },
    });
  });

  // GET /api/content/:id
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const content = await prisma.content.findUnique({
      where: { id, status: "PUBLISHED" },
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
      return reply.code(404).send({ error: "Content not found" });
    }

    // Increment view count (fire and forget)
    void prisma.content.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return reply.send(content);
  });
};
