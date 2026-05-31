export const dynamic = "force-dynamic";

import { prisma } from "@kairo/database";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

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

const CATEGORY_QUERIES: Record<string, string> = {
  biblical_films:  '(subject:"bible" OR subject:"biblical" OR subject:"jesus" OR subject:"christ") mediatype:movies',
  christian_movies:'(subject:"christian" OR subject:"christianity" OR subject:"evangelical") mediatype:movies',
  billy_graham:    'subject:"Billy Graham" mediatype:movies',
  sermons:         '(subject:"sermon" OR subject:"preaching" OR subject:"gospel message") mediatype:movies',
  gospel_music:    '(subject:"gospel music" OR subject:"christian music" OR subject:"hymn") mediatype:movies',
  missionaries:    '(subject:"missionary" OR subject:"missions" OR subject:"evangelism") mediatype:movies',
  kids_faith:      '(subject:"christian children" OR subject:"bible stories" OR subject:"vacation bible") mediatype:movies',
  documentaries:   '(subject:"religious documentary" OR subject:"christian documentary" OR subject:"holy land") mediatype:movies',
};

const schema = z.object({
  category: z.string(),
  maxItems: z.number().min(1).max(5000).default(1000),
});

interface ArchiveDoc {
  identifier: string;
  title?: string;
  description?: string | string[];
  year?: string | number;
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    return Response.json({ error: "Invalid request", details: e }, { status: 400 });
  }

  const query = CATEGORY_QUERIES[body.category];
  if (!query) return Response.json({ error: "Unknown category" }, { status: 400 });

  const catConfig = CATEGORY_MAP[body.category]!;
  const results = { imported: 0, skipped: 0, errors: 0, total: 0 };

  // Paginate through Archive.org results
  const PAGE_SIZE = 100;
  let start = 0;

  while (results.imported + results.skipped < body.maxItems) {
    const remaining = body.maxItems - results.imported - results.skipped;
    const rows = Math.min(PAGE_SIZE, remaining);

    const params = new URLSearchParams({
      q: query,
      "fl[]": "identifier,title,description,year",
      rows: rows.toString(),
      start: start.toString(),
      output: "json",
      sort: "downloads desc",
    });

    let page: { response: { docs: ArchiveDoc[]; numFound: number } };
    try {
      const res = await fetch(`https://archive.org/advancedsearch.php?${params}`);
      if (!res.ok) break;
      page = await res.json();
    } catch {
      break;
    }

    const docs = page.response?.docs ?? [];
    results.total = page.response?.numFound ?? 0;

    if (docs.length === 0) break;

    for (const doc of docs) {
      if (!doc.identifier) { results.errors++; continue; }

      try {
        const existing = await prisma.content.findFirst({
          where: { providerContentId: doc.identifier },
          select: { id: true },
        });

        if (existing) {
          // Update tags if missing
          const hasTag = await prisma.content.findFirst({
            where: { id: existing.id, tags: { isEmpty: false } },
          });
          if (!hasTag) {
            await prisma.content.update({
              where: { id: existing.id },
              data: { tags: catConfig.tags, type: catConfig.type as never },
            });
          }
          results.skipped++;
          continue;
        }

        const description = Array.isArray(doc.description)
          ? doc.description[0]
          : (doc.description ?? doc.title ?? doc.identifier);

        await prisma.content.create({
          data: {
            title: (doc.title ?? doc.identifier).slice(0, 255),
            description: (description ?? "").slice(0, 2000),
            type: catConfig.type as never,
            sourceType: "EMBED",
            providerContentId: doc.identifier,
            embedUrl: `https://archive.org/embed/${doc.identifier}`,
            sourceUrl: `https://archive.org/details/${doc.identifier}`,
            thumbnailUrl: `https://archive.org/services/img/${doc.identifier}`,
            releaseYear: doc.year ? parseInt(String(doc.year), 10) || null : null,
            isKids: catConfig.type === "KIDS",
            tags: catConfig.tags,
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

    start += docs.length;
    if (start >= results.total) break;

    // Small delay to avoid hammering Archive.org
    await new Promise((r) => setTimeout(r, 200));
  }

  return Response.json(results);
}
