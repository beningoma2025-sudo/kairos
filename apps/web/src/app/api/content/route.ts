import { prisma } from "@kairo/database";
import type { AgeRating, ContentStatus, ContentType } from "@kairo/database";
import { z } from "zod";

// Maps kids age group to appropriate age ratings
const AGE_GROUP_RATINGS: Record<string, AgeRating[]> = {
  "2-5": ["TV_Y", "G"],
  "6-9": ["TV_Y7", "TV_G", "G"],
  "10-13": ["TV_G", "TV_PG", "PG"],
};

const querySchema = z.object({
  type: z
    .enum(["movie", "series", "episode", "documentary", "teaching", "kids", "live_event", "short"])
    .optional(),
  featured: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  kids: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  ageGroup: z.enum(["2-5", "6-9", "10-13"]).optional(),
  channelId: z.string().optional(),
  seriesId: z.string().optional(),
  sort: z.enum(["newest", "popular", "trending"]).default("newest"),
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v ?? "1", 10) || 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(50, Math.max(1, parseInt(v ?? "20", 10) || 20))),
  search: z.string().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());

  let query: z.infer<typeof querySchema>;
  try {
    query = querySchema.parse(raw);
  } catch {
    return Response.json({ error: "Invalid query" }, { status: 400 });
  }

  const where = {
    status: "PUBLISHED" as ContentStatus,
    ...(query.type && { type: query.type.toUpperCase() as ContentType }),
    ...(query.featured !== undefined && { isFeatured: query.featured }),
    ...(query.kids !== undefined && { isKids: query.kids }),
    ...(query.ageGroup && { ageRating: { in: AGE_GROUP_RATINGS[query.ageGroup] } }),
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
        categories: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.content.count({ where }),
  ]);

  return Response.json(
    {
      data,
      pagination: {
        page: query.page,
        pageSize: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNextPage: query.page * query.limit < total,
        hasPrevPage: query.page > 1,
      },
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
