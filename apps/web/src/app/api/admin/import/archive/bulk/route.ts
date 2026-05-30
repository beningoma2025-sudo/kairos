export const dynamic = "force-dynamic";

import { prisma } from "@kairo/database";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const schema = z.object({
  items: z.array(z.object({
    identifier: z.string(),
    title: z.string(),
    description: z.string().optional(),
    thumbnailUrl: z.string(),
    embedUrl: z.string(),
    sourceUrl: z.string(),
    year: z.union([z.string(), z.number()]).nullable().optional(),
    isKids: z.boolean().default(false),
  })),
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

  const results = { imported: 0, skipped: 0, errors: 0 };

  for (const item of body.items) {
    try {
      const existing = await prisma.content.findFirst({
        where: { providerContentId: item.identifier },
      });
      if (existing) { results.skipped++; continue; }

      const releaseYear = item.year
        ? parseInt(String(item.year), 10) || null
        : null;

      await prisma.content.create({
        data: {
          title: item.title.slice(0, 255),
          description: (item.description ?? item.title).slice(0, 2000),
          type: body.isKids ? "KIDS" : "MOVIE",
          sourceType: "EMBED",
          providerContentId: item.identifier,
          embedUrl: item.embedUrl,
          sourceUrl: item.sourceUrl,
          thumbnailUrl: item.thumbnailUrl,
          releaseYear,
          isKids: body.isKids,
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
