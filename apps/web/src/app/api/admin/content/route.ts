import { prisma } from "@kairo/database";
import type { AgeRating, ContentType, ContentStatus } from "@kairo/database";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const listQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  page: z.string().optional().transform((v) => Math.max(1, parseInt(v ?? "1", 10) || 1)),
  limit: z.string().optional().transform((v) => Math.min(50, parseInt(v ?? "20", 10) || 20)),
});

const createSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(5000).trim(),
  type: z.enum(["MOVIE", "SERIES", "EPISODE", "DOCUMENTARY", "TEACHING", "KIDS", "SHORT"]),
  ageRating: z.enum(["G", "PG", "PG_13", "TV_Y", "TV_Y7", "TV_G", "TV_PG"]).default("PG"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  muxUploadId: z.string().min(1),
  isKids: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  channelId: z.string().optional(),
  publishNow: z.boolean().default(false),
});

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const query = listQuerySchema.parse(Object.fromEntries(url.searchParams));

  const where = {
    ...(query.status && { status: query.status.toUpperCase() as ContentStatus }),
    ...(query.type && { type: query.type.toUpperCase() as ContentType }),
  };

  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        thumbnailUrl: true,
        viewCount: true,
        isFeatured: true,
        isKids: true,
        muxPlaybackId: true,
        muxAssetId: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    prisma.content.count({ where }),
  ]);

  return Response.json({
    data: items,
    pagination: {
      page: query.page,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNextPage: query.page * query.limit < total,
    },
  });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch (e) {
    return Response.json({ error: "Invalid request", details: e }, { status: 400 });
  }

  const content = await prisma.content.create({
    data: {
      title: body.title,
      description: body.description,
      type: body.type as ContentType,
      ageRating: body.ageRating as AgeRating,
      thumbnailUrl: body.thumbnailUrl || "https://image.mux.com/placeholder.png",
      isKids: body.isKids,
      isFeatured: body.isFeatured,
      tags: body.tags,
      channelId: body.channelId ?? null,
      // Store upload ID temporarily — updated by Mux webhook when asset is ready
      muxAssetId: body.muxUploadId,
      status: body.publishNow ? "PUBLISHED" : ("PROCESSING" as ContentStatus),
      publishedAt: body.publishNow ? new Date() : null,
    },
    select: { id: true, title: true, status: true },
  });

  return Response.json(content, { status: 201 });
}
