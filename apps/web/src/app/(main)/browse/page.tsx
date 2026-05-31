export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";
import { FeaturedHero } from "@/components/content/FeaturedHero";
import { ContentRowClient } from "@/components/content/ContentRow";
import { GenreBar } from "@/components/content/GenreBar";
import { LiveBanner } from "@/components/live/LiveBanner";
import { ContentRowSkeleton } from "@/components/ui/Skeletons";
import { getContentList, getByTag, getDynamicRows } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Browse | Kairo",
  description: "Discover faith-centered movies, series, teachings, and live events.",
};

const TAG_LABELS: Record<string, string> = {
  "biblical": "Films Bibliques ✝️",
  "christian": "Films Chrétiens 🙏",
  "billy-graham": "Billy Graham 🎤",
  "sermon": "Sermons 📖",
  "gospel-music": "Musique Gospel 🎵",
  "missionary": "Missionnaires 🌍",
  "kids": "Enfants & Foi 👶",
  "documentary": "Documentaires 🎞️",
  "worship": "Worship 🎶",
  "hymns": "Hymnes 🎼",
  "bible-stories": "Histoires Bibliques 📚",
  "evangelism": "Évangélisation 🌟",
  "missions": "Missions 🌐",
  "preaching": "Prédication 🗣️",
  "faith-film": "Foi & Cinéma 🎥",
  "christian-history": "Histoire Chrétienne 🏛️",
};

const TYPE_LABELS: Record<string, string> = {
  movie: "Movies 🎬",
  series: "Series 📺",
  documentary: "Documentaries 🎞️",
  teaching: "Teachings 📖",
  short: "Shorts ⚡",
  episode: "Episodes 🎙️",
};

async function ContinueWatching({ userId }: { userId: string }) {
  const history = await prisma.watchHistory.findMany({
    where: { userId, completedAt: null, progressSeconds: { gt: 30 } },
    orderBy: { watchedAt: "desc" },
    take: 10,
    select: {
      content: {
        select: {
          id: true, title: true, description: true, type: true, status: true,
          ageRating: true, thumbnailUrl: true, backdropUrl: true, duration: true,
          releaseYear: true, language: true, sourceType: true, muxPlaybackId: true,
          embedUrl: true, streamUrl: true, sourceUrl: true, providerContentId: true,
          isFeatured: true, isKids: true, viewCount: true, likeCount: true,
          publishedAt: true, tags: true,
          provider: { select: { id: true, name: true, logoUrl: true, slug: true } },
        },
      },
    },
  });
  const items = history.map((h) => h.content);
  if (items.length === 0) return null;
  return <ContentRowClient title="Continue Watching" items={items} />;
}

interface BrowsePageProps {
  searchParams: Promise<{ type?: string; tag?: string }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { type, tag } = await searchParams;
  const { userId: clerkId } = await auth();
  const dbUser = clerkId
    ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null;

  // ── Filtered view (by type or tag) ──────────────────────────
  if (type || tag) {
    const title = tag
      ? (TAG_LABELS[tag] ?? tag)
      : (TYPE_LABELS[type!] ?? type!);

    const items = tag
      ? await getByTag(tag, 48)
      : await getContentList({ type, limit: 48 });

    return (
      <div className="min-h-screen bg-kairo-dark pt-24 px-8 pb-16 max-w-[1800px] mx-auto">
        <div className="mb-6">
          <Suspense fallback={null}>
            <GenreBar />
          </Suspense>
        </div>

        <h1 className="text-2xl font-display font-bold text-white mb-6">{title}</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-white/25">
            <p className="text-lg mb-2">Aucun contenu dans cette catégorie</p>
            <p className="text-sm">Utilise Admin → Import Archive pour ajouter du contenu</p>
          </div>
        ) : (
          <ContentRowClient title="" items={items} grid />
        )}
      </div>
    );
  }

  // ── Homepage view ────────────────────────────────────────────
  const [featured, newReleases, movies, teachings, kidsContent, series, dynamicRows] = await Promise.all([
    getContentList({ featured: true, limit: 10 }),
    getContentList({ sort: "newest", limit: 20 }),
    getContentList({ type: "movie", limit: 20 }),
    getContentList({ type: "teaching", limit: 20 }),
    getContentList({ kids: true, limit: 20 }),
    getContentList({ type: "series", limit: 20 }),
    getDynamicRows(),
  ]);

  return (
    <div className="min-h-screen bg-kairo-dark">
      {/* Hero */}
      <Suspense fallback={<div className="h-[70vh] bg-kairo-dark-card animate-pulse" />}>
        <FeaturedHero />
      </Suspense>

      <div className="px-8 py-6 max-w-[1800px] mx-auto space-y-8">

        {/* Genre filter bar */}
        <Suspense fallback={null}>
          <GenreBar />
        </Suspense>

        {/* Live banner */}
        <Suspense fallback={null}>
          <LiveBanner />
        </Suspense>

        {/* Continue Watching */}
        {dbUser && (
          <Suspense fallback={<ContentRowSkeleton title="Continue Watching" />}>
            <ContinueWatching userId={dbUser.id} />
          </Suspense>
        )}

        {/* Static content type rows */}
        {featured.length > 0 && <ContentRowClient title="⭐ Featured" items={featured} />}
        {newReleases.length > 0 && <ContentRowClient title="🆕 New Releases" items={newReleases} />}
        {movies.length > 0 && <ContentRowClient title="🎬 Movies" items={movies} linkHref="/browse?type=movie" linkLabel="See all" />}
        {teachings.length > 0 && <ContentRowClient title="📖 Teachings" items={teachings} linkHref="/browse?type=teaching" linkLabel="See all" />}
        {series.length > 0 && <ContentRowClient title="📺 Series" items={series} linkHref="/browse?type=series" linkLabel="See all" />}
        {kidsContent.length > 0 && <ContentRowClient title="👶 Kairo Kids" items={kidsContent} linkHref="/kids" linkLabel="Go to Kids" />}

        {/* Dynamic rows from imported categories */}
        {dynamicRows.map((row) => (
          <ContentRowClient
            key={row.title}
            title={`${row.emoji} ${row.title}`}
            items={row.items}
          />
        ))}
      </div>
    </div>
  );
}
