export const dynamic = "force-dynamic";

import { prisma } from "@kairo/database";
import { requireAdmin } from "@/lib/admin-auth";

// Re-tag all untagged Archive.org content based on their Archive.org subjects
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  // Find all published content without tags that came from Archive.org
  const untagged = await prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      sourceType: "EMBED",
      providerContentId: { not: null },
      tags: { isEmpty: true },
    },
    select: { id: true, title: true, description: true, type: true },
    take: 5000,
  });

  let updated = 0;

  for (const content of untagged) {
    const text = `${content.title} ${content.description}`.toLowerCase();
    const tags: string[] = [];
    let type = content.type;

    // Detect category from title/description text
    if (/bible|biblical|scripture|testament|genesis|exodus|psalms|gospel of|book of/.test(text)) {
      tags.push("biblical", "bible");
      type = "MOVIE";
    } else if (/billy graham|graham crusade/.test(text)) {
      tags.push("billy-graham", "evangelism");
      type = "TEACHING";
    } else if (/sermon|preaching|pastor|reverend|sunday service|church service/.test(text)) {
      tags.push("sermon", "preaching");
      type = "TEACHING";
    } else if (/gospel|hymn|choir|worship|christian music|spiritual song/.test(text)) {
      tags.push("gospel-music", "worship");
    } else if (/missionary|mission|evangelism|evangelist|revival/.test(text)) {
      tags.push("missionary", "missions");
      type = "DOCUMENTARY";
    } else if (/children|kids|vacation bible|sunday school|bible story/.test(text)) {
      tags.push("kids", "bible-stories");
      type = "KIDS";
    } else if (/documentary|history of|story of|christian history|church history/.test(text)) {
      tags.push("documentary", "christian-history");
      type = "DOCUMENTARY";
    } else if (/christian|christ|jesus|faith|prayer|salvation/.test(text)) {
      tags.push("christian", "faith-film");
    }

    if (tags.length > 0) {
      await prisma.content.update({
        where: { id: content.id },
        data: { tags, type: type as never },
      });
      updated++;
    }
  }

  return Response.json({ untagged: untagged.length, updated });
}
