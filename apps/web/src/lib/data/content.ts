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
}): Promise<ContentItem[]> {
  const { type, kids, featured, sort = "newest", limit = 20 } = params;

  return prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      ...(type && { type: type.toUpperCase() as never }),
      ...(kids !== undefined && { isKids: kids }),
      ...(featured !== undefined && { isFeatured: featured }),
    },
    orderBy: sort === "popular" ? { viewCount: "desc" } : { publishedAt: "desc" },
    take: limit,
    select: SELECT,
  });
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
