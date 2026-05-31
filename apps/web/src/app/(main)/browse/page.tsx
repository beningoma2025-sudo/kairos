export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";
import { FeaturedHero } from "@/components/content/FeaturedHero";
import { ContentRowClient } from "@/components/content/ContentRow";
import { LiveBanner } from "@/components/live/LiveBanner";
import { ContentRowSkeleton } from "@/components/ui/Skeletons";
import { getContentList } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Browse | Kairo",
  description: "Discover faith-centered movies, series, teachings, and live events.",
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

export default async function BrowsePage() {
  const { userId: clerkId } = await auth();
  const dbUser = clerkId
    ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null;

  const [featured, newReleases, teachings, movies, kidsContent, series] = await Promise.all([
    getContentList({ featured: true, limit: 10 }),
    getContentList({ sort: "newest", limit: 20 }),
    getContentList({ type: "teaching", limit: 20 }),
    getContentList({ type: "movie", limit: 20 }),
    getContentList({ kids: true, limit: 20 }),
    getContentList({ type: "series", limit: 20 }),
  ]);

  return (
    <div className="min-h-screen bg-kairo-dark">
      <Suspense fallback={<div className="h-[70vh] bg-kairo-dark-card animate-pulse" />}>
        <FeaturedHero />
      </Suspense>

      <div className="px-8 py-8 space-y-10 max-w-[1800px] mx-auto">
        <Suspense fallback={null}>
          <LiveBanner />
        </Suspense>

        {dbUser && (
          <Suspense fallback={<ContentRowSkeleton title="Continue Watching" />}>
            <ContinueWatching userId={dbUser.id} />
          </Suspense>
        )}

        {featured.length > 0 && (
          <ContentRowClient title="Featured" items={featured} />
        )}

        {newReleases.length > 0 && (
          <ContentRowClient title="New Releases" items={newReleases} />
        )}

        {movies.length > 0 && (
          <ContentRowClient title="Movies" items={movies} />
        )}

        {teachings.length > 0 && (
          <ContentRowClient title="Teachings & Sermons" items={teachings} />
        )}

        {kidsContent.length > 0 && (
          <ContentRowClient title="Kairo Kids" items={kidsContent} linkHref="/kids" linkLabel="Go to Kids" />
        )}

        {series.length > 0 && (
          <ContentRowClient title="Series" items={series} />
        )}
      </div>
    </div>
  );
}
