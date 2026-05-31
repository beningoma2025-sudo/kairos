export const dynamic = "force-dynamic";

import { prisma } from "@kairo/database";

// Human labels for content types
const TYPE_LABELS: Record<string, { label: string; emoji: string; href: string }> = {
  MOVIE:       { label: "Movies",        emoji: "🎬", href: "/browse?type=movie" },
  SERIES:      { label: "Series",        emoji: "📺", href: "/browse?type=series" },
  DOCUMENTARY: { label: "Documentaries", emoji: "🎞️", href: "/browse?type=documentary" },
  TEACHING:    { label: "Teachings",     emoji: "📖", href: "/browse?type=teaching" },
  KIDS:        { label: "Kids",          emoji: "👶", href: "/kids" },
  SHORT:       { label: "Shorts",        emoji: "⚡", href: "/browse?type=short" },
  EPISODE:     { label: "Episodes",      emoji: "🎙️", href: "/browse?type=episode" },
};

// Human labels for known tags
const TAG_LABELS: Record<string, { label: string; emoji: string }> = {
  "biblical":         { label: "Films Bibliques",  emoji: "✝️" },
  "bible":            { label: "Bible",             emoji: "📜" },
  "christian":        { label: "Films Chrétiens",   emoji: "🙏" },
  "faith-film":       { label: "Foi & Cinéma",      emoji: "🎥" },
  "billy-graham":     { label: "Billy Graham",       emoji: "🎤" },
  "evangelism":       { label: "Évangélisation",    emoji: "🌟" },
  "sermon":           { label: "Sermons",            emoji: "📣" },
  "preaching":        { label: "Prédication",        emoji: "🗣️" },
  "gospel-music":     { label: "Musique Gospel",    emoji: "🎵" },
  "worship":          { label: "Worship",            emoji: "🎶" },
  "hymns":            { label: "Hymnes",             emoji: "🎼" },
  "missionary":       { label: "Missionnaires",      emoji: "🌍" },
  "missions":         { label: "Missions",           emoji: "🌐" },
  "kids":             { label: "Enfants",            emoji: "👦" },
  "bible-stories":    { label: "Histoires Bibliques",emoji: "📚" },
  "documentary":      { label: "Documentaires",      emoji: "🎞️" },
  "christian-history":{ label: "Histoire Chrétienne",emoji: "🏛️" },
};

export async function GET() {
  // Get content types that have published content
  const typeGroups = await prisma.content.groupBy({
    by: ["type"],
    where: { status: "PUBLISHED" },
    _count: { _all: true },
    orderBy: { _count: { type: "desc" } },
  });

  // Get all tags from published content
  const allContent = await prisma.content.findMany({
    where: { status: "PUBLISHED", NOT: { tags: { isEmpty: true } } },
    select: { tags: true },
  });

  // Count tag occurrences
  const tagCounts: Record<string, number> = {};
  for (const c of allContent) {
    for (const tag of c.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  const types = typeGroups
    .filter((g) => g._count._all >= 1 && TYPE_LABELS[g.type])
    .map((g) => ({
      key: `type:${g.type.toLowerCase()}`,
      label: TYPE_LABELS[g.type]!.label,
      emoji: TYPE_LABELS[g.type]!.emoji,
      href: TYPE_LABELS[g.type]!.href,
      count: g._count._all,
      isType: true,
    }));

  const tags = Object.entries(tagCounts)
    .filter(([tag, count]) => count >= 1 && TAG_LABELS[tag])
    .sort(([, a], [, b]) => b - a)
    .map(([tag, count]) => ({
      key: `tag:${tag}`,
      label: TAG_LABELS[tag]!.label,
      emoji: TAG_LABELS[tag]!.emoji,
      href: `/browse?tag=${encodeURIComponent(tag)}`,
      count,
      isType: false,
    }));

  return Response.json({ types, tags });
}
