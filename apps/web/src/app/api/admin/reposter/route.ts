export const dynamic = "force-dynamic";

import { prisma } from "@kairo/database";
import { requireAdmin } from "@/lib/admin-auth";
import { searchTMDB } from "@/lib/tmdb";

const BATCH = 20; // items processed per call

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({})) as { limit?: number };
  const limit = Math.min(body.limit ?? 100, 500);

  // Find content that still uses Archive.org thumbnails (no real poster yet)
  const items = await prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      thumbnailUrl: { contains: "archive.org/services/img" },
    },
    select: { id: true, title: true, releaseYear: true },
    take: limit,
  });

  const results = { total: items.length, updated: 0, notFound: 0, skipped: 0 };

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);

    await Promise.all(
      batch.map(async (item) => {
        const tmdb = await searchTMDB(item.title, item.releaseYear);
        if (!tmdb?.posterUrl) {
          results.notFound++;
          return;
        }
        await prisma.content.update({
          where: { id: item.id },
          data: {
            thumbnailUrl: tmdb.posterUrl,
            ...(tmdb.backdropUrl  && { backdropUrl:  tmdb.backdropUrl }),
            ...(tmdb.overview     && { description:   tmdb.overview.slice(0, 2000) }),
            ...(tmdb.releaseYear  && { releaseYear:   tmdb.releaseYear }),
          },
        });
        results.updated++;
      }),
    );

    // Small pause between batches to respect TMDB rate limit (40 req/10s)
    if (i + BATCH < items.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return Response.json(results);
}
