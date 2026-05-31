import { prisma } from "@kairo/database";

export type ContentItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  ageRating: string;
  thumbnailUrl: string;
  backdropUrl: string | null;
  duration: number | null;
  releaseYear: number | null;
  language: string;
  sourceType: string;
  muxPlaybackId: string | null;
  embedUrl: string | null;
  streamUrl: string | null;
  sourceUrl: string | null;
  providerContentId: string | null;
  isFeatured: boolean;
  isKids: boolean;
  viewCount: number;
  likeCount: number;
  publishedAt: Date | null;
  tags: string[];
  provider: { id: string; name: string; logoUrl: string | null; slug: string } | null;
};

const SELECT = {
  id: true, title: true, description: true, type: true, status: true,
  ageRating: true, thumbnailUrl: true, backdropUrl: true, duration: true,
  releaseYear: true, language: true, sourceType: true, muxPlaybackId: true,
  embedUrl: true, streamUrl: true, sourceUrl: true, providerContentId: true,
  isFeatured: true, isKids: true, viewCount: true, likeCount: true,
  publishedAt: true, tags: true,
  provider: { select: { id: true, name: true, logoUrl: true, slug: true } },
} as const;

export async function getFeatured(limit = 5): Promise<ContentItem[]> {
  return prisma.content.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: SELECT,
  });
}

export async function getContentList(params: {
  type?: string;
  kids?: boolean;
  featured?: boolean;
  sort?: "newest" | "popular";
  limit?: number;
  page?: number;
}): Promise<ContentItem[]> {
  const { type, kids, featured, sort = "newest", limit = 20, page = 1 } = params;

  return prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      ...(type && { type: type.toUpperCase() as never }),
      ...(kids !== undefined && { isKids: kids }),
      ...(featured !== undefined && { isFeatured: featured }),
    },
    orderBy: sort === "popular" ? { viewCount: "desc" } : { publishedAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    select: SELECT,
  });
}

export async function getContentListWithTotal(params: {
  type?: string;
  kids?: boolean;
  featured?: boolean;
  sort?: "newest" | "popular";
  limit?: number;
  page?: number;
}): Promise<{ items: ContentItem[]; total: number }> {
  const { type, kids, featured, sort = "newest", limit = 48, page = 1 } = params;

  const where = {
    status: "PUBLISHED" as never,
    ...(type && { type: type.toUpperCase() as never }),
    ...(kids !== undefined && { isKids: kids }),
    ...(featured !== undefined && { isFeatured: featured }),
  };

  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: sort === "popular" ? { viewCount: "desc" } : { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: SELECT,
    }),
    prisma.content.count({ where }),
  ]);

  return { items, total };
}

export async function getByTag(tag: string, limit = 20): Promise<ContentItem[]> {
  return prisma.content.findMany({
    where: { status: "PUBLISHED", tags: { has: tag } },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: SELECT,
  });
}

export async function getByTagWithTotal(
  tag: string,
  limit = 48,
  page = 1,
): Promise<{ items: ContentItem[]; total: number }> {
  const where = { status: "PUBLISHED" as never, tags: { has: tag } };
  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { viewCount: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: SELECT,
    }),
    prisma.content.count({ where }),
  ]);
  return { items, total };
}

// Returns populated genre rows for homepage: {tag, title, emoji, items}[]
export async function getDynamicRows(): Promise<{ tag: string; title: string; emoji: string; items: ContentItem[] }[]> {
  const TAG_ROWS: { tag: string; label: string; emoji: string }[] = [
    { tag: "biblical",      label: "Films Bibliques",   emoji: "✝️" },
    { tag: "billy-graham",  label: "Billy Graham",      emoji: "🎤" },
    { tag: "gospel-music",  label: "Musique Gospel",    emoji: "🎵" },
    { tag: "missionary",    label: "Missionnaires",     emoji: "🌍" },
    { tag: "sermon",        label: "Sermons",           emoji: "📖" },
    { tag: "christian",     label: "Films Chrétiens",   emoji: "🙏" },
    { tag: "worship",       label: "Worship",           emoji: "🎶" },
  ];

  const rows = await Promise.all(
    TAG_ROWS.map(async (r) => {
      const items = await prisma.content.findMany({
        where: { status: "PUBLISHED", tags: { has: r.tag } },
        orderBy: { viewCount: "desc" },
        take: 20,
        select: SELECT,
      });
      return { tag: r.tag, title: r.label, emoji: r.emoji, items };
    })
  );

  return rows.filter((r) => r.items.length > 0);
}

export async function getRelated(contentId: string, type: string, limit = 8): Promise<ContentItem[]> {
  return prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      type: type as never,
      id: { not: contentId },
    },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: SELECT,
  });
}

export async function getLiveEvents() {
  return prisma.liveEvent.findMany({
    where: { status: { in: ["LIVE", "SCHEDULED"] } },
    orderBy: { scheduledStartAt: "asc" },
    take: 3,
    select: {
      id: true, title: true, description: true, thumbnailUrl: true,
      status: true, scheduledStartAt: true, viewerCount: true,
      muxPlaybackId: true, channel: { select: { name: true, logoUrl: true } },
    },
  });
}
