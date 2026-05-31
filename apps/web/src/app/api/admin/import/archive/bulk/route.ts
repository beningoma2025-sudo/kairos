export const dynamic = "force-dynamic";

import { prisma } from "@kairo/database";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

// Map Archive.org category keys to DB content type + tags
const CATEGORY_MAP: Record<string, { type: string; tags: string[] }> = {
  biblical_films:  { type: "MOVIE",       tags: ["biblical", "bible", "films-bibliques"] },
  christian_movies:{ type: "MOVIE",       tags: ["christian", "faith-film"] },
  billy_graham:    { type: "TEACHING",    tags: ["billy-graham", "evangelism"] },
  sermons:         { type: "TEACHING",    tags: ["sermon", "preaching"] },
  gospel_music:    { type: "SHORT",       tags: ["gospel-music", "worship", "hymns"] },
  missionaries:    { type: "DOCUMENTARY", tags: ["missionary", "missions"] },
  kids_faith:      { type: "KIDS",        tags: ["kids", "bible-stories"] },
  documentaries:   { type: "DOCUMENTARY", tags: ["documentary", "christian-history"] },
};

const schema = z.object({
  items: z.array(z.object({
    identifier: z.string(),
    title: z.string(),
    description: z.string().optional(),
    thumbnailUrl: z.string(),
    embedUrl: z.string(),
    sourceUrl: z.string(),
    year: z.union([z.string(), z.number()]).nullable().optional(),
  })),
  category: z.string().optional(),
  isKids: z.boolean().default(false),
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    return Response.json({ error: "Invalid request", details: e }, { status: 400 });
  }

  const catConfig = body.category ? (CATEGORY_MAP[body.category] ?? null) : null;
  const contentType = catConfig?.type ?? (body.isKids ? "KIDS" : "MOVIE");
  const tags = catConfig?.tags ?? [];

  const results = { imported: 0, skipped: 0, errors: 0 };

  for (const item of body.items) {
    try {
      const existing = await prisma.content.findFirst({
        where: { providerContentId: item.identifier },
      });
      if (existing) { results.skipped++; continue; }

      const releaseYear = item.year ? parseInt(String(item.year), 10) || null : null;

      await prisma.content.create({
        data: {
          title: item.title.slice(0, 255),
          description: (item.description ?? item.title).slice(0, 2000),
          type: contentType as never,
          sourceType: "EMBED",
          providerContentId: item.identifier,
          embedUrl: item.embedUrl,
          sourceUrl: item.sourceUrl,
          thumbnailUrl: item.thumbnailUrl,
          releaseYear,
          isKids: contentType === "KIDS" || body.isKids,
          tags,
          status: "PUBLISHED",
          publishedAt: new Date(),
          language: "en",
        },
      });
      results.imported++;
    } catch {
      results.errors++;
    }
  }

  return Response.json(results);
}
