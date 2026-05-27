import type { Metadata } from "next";
import { Suspense } from "react";
import { FeaturedHero } from "@/components/content/FeaturedHero";
import { ContentRow } from "@/components/content/ContentRow";
import { LiveBanner } from "@/components/live/LiveBanner";
import { ContentRowSkeleton } from "@/components/ui/Skeletons";

export const metadata: Metadata = {
  title: "Browse",
  description: "Discover faith-centered movies, series, kids content, and live events.",
};

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-kairo-dark">
      {/* Featured Hero */}
      <Suspense fallback={<div className="h-[70vh] bg-kairo-dark-card animate-pulse" />}>
        <FeaturedHero />
      </Suspense>

      <div className="px-8 py-8 space-y-10 max-w-[1800px] mx-auto">
        {/* Live Banner */}
        <Suspense fallback={null}>
          <LiveBanner />
        </Suspense>

        {/* Continue Watching */}
        <Suspense fallback={<ContentRowSkeleton title="Continue Watching" />}>
          <ContentRow title="Continue Watching" endpoint="/api/content/continue-watching" />
        </Suspense>

        {/* Featured Movies */}
        <Suspense fallback={<ContentRowSkeleton title="Featured Movies" />}>
          <ContentRow title="Featured Movies" endpoint="/api/content?type=movie&featured=true" />
        </Suspense>

        {/* New Releases */}
        <Suspense fallback={<ContentRowSkeleton title="New Releases" />}>
          <ContentRow title="New Releases" endpoint="/api/content?sort=newest" />
        </Suspense>

        {/* Kairo Kids */}
        <Suspense fallback={<ContentRowSkeleton title="Kairo Kids" />}>
          <ContentRow
            title="Kairo Kids"
            endpoint="/api/content?kids=true"
            linkHref="/kids"
            linkLabel="Go to Kids"
            accentColor="#C9A84C"
          />
        </Suspense>

        {/* Documentaries */}
        <Suspense fallback={<ContentRowSkeleton title="Documentaries & Teachings" />}>
          <ContentRow title="Documentaries & Teachings" endpoint="/api/content?type=documentary" />
        </Suspense>

        {/* Series */}
        <Suspense fallback={<ContentRowSkeleton title="Series" />}>
          <ContentRow title="Series" endpoint="/api/content?type=series" />
        </Suspense>
      </div>
    </div>
  );
}
