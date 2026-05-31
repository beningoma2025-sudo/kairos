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
import { getContentList, getByTag, getContentListWithTotal, getByTagWithTotal, getDynamicRows } from "@/lib/data/content";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VideoGrid from "@/components/VideoGrid";
import type { Section, Video } from "@/types/video";
import type { ContentItem } from "@/lib/data/content";

function toVideo(item: ContentItem): Video {
  return {
    id: item.id,
    title: item.title,
    poster: item.thumbnailUrl,
    videoUrl: `/watch/${item.id}`,
    year: item.releaseYear ?? undefined,
    duration: item.duration
      ? item.duration >= 3600
        ? `${Math.floor(item.duration / 3600)}h ${Math.floor((item.duration % 3600) / 60)}m`
        : `${Math.floor(item.duration / 60)}m`
      : undefined,
    rating: item.ageRating ?? undefined,
    genre: item.type,
  };
}

function Pagination({ page, totalPages, baseUrl }: { page: number; totalPages: number; baseUrl: string }) {
  const pages: (number | "…")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const href = (p: number) => `${baseUrl}&page=${p}`;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 mt-14">
      {/* Précédent */}
      {page > 1 ? (
        <a href={href(page - 1)} className="flex items-center gap-1 px-3 py-2 rounded-md bg-white border border-[#e5e5e5] text-[#555] text-sm hover:border-[#111] hover:text-[#111] transition-all">
          <ChevronLeft size={14} /> Préc.
        </a>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 rounded-md text-[#ccc] text-sm cursor-not-allowed select-none">
          <ChevronLeft size={14} /> Préc.
        </span>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-[#bbb] text-sm select-none">…</span>
        ) : p === page ? (
          <span key={p} className="w-9 h-9 flex items-center justify-center rounded-md bg-[#111] text-white font-bold text-sm">{p}</span>
        ) : (
          <a key={p} href={href(p)} className="w-9 h-9 flex items-center justify-center rounded-md bg-white border border-[#e5e5e5] text-[#555] text-sm hover:border-[#111] hover:text-[#111] transition-all">{p}</a>
        )
      )}

      {page < totalPages ? (
        <a href={href(page + 1)} className="flex items-center gap-1 px-3 py-2 rounded-md bg-white border border-[#e5e5e5] text-[#555] text-sm hover:border-[#111] hover:text-[#111] transition-all">
          Suiv. <ChevronRight size={14} />
        </a>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 rounded-md text-[#ccc] text-sm cursor-not-allowed select-none">
          Suiv. <ChevronRight size={14} />
        </span>
      )}
    </nav>
  );
}

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

const PAGE_SIZE = 48;

interface BrowsePageProps {
  searchParams: { type?: string; tag?: string; page?: string };
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { type, tag } = searchParams;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { userId: clerkId } = await auth();
  const dbUser = clerkId
    ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null;

  // ── Filtered view (by type or tag) ──────────────────────────
  if (type || tag) {
    const title = tag
      ? (TAG_LABELS[tag] ?? tag)
      : (TYPE_LABELS[type!] ?? type!);

    const { items, total } = tag
      ? await getByTagWithTotal(tag, PAGE_SIZE, page)
      : await getContentListWithTotal({ type: type ?? undefined, limit: PAGE_SIZE, page });

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const baseUrl = tag ? `/browse?tag=${tag}` : `/browse?type=${type}`;

    return (
      <div className="min-h-screen bg-[#0f0f1a] pt-24 px-8 pb-16 max-w-[1800px] mx-auto">
        <div className="mb-6">
          <Suspense fallback={null}>
            <GenreBar />
          </Suspense>
        </div>

        <div className="flex items-baseline gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <span className="text-white/40 text-sm">{total} vidéos</span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-white/25">
            <p className="text-lg mb-2">Aucun contenu dans cette catégorie</p>
            <p className="text-sm">Utilise Admin → Import Archive pour ajouter du contenu</p>
          </div>
        ) : (
          <>
            <VideoGrid sections={[{ title: "", videos: items.map(toVideo) }]} />

            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} baseUrl={baseUrl} />
            )}
          </>
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
    <div className="min-h-screen bg-[#0f0f1a]">

      <div className="pt-24 pb-8 space-y-8">

        {/* ── Tubi-style featured cards hero ───────────────── */}
        <Suspense fallback={
          <div className="px-4 sm:px-8 max-w-[1800px] mx-auto">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-[calc(50%-6px)] rounded-xl bg-gray-100 animate-pulse" style={{ height: "clamp(220px, 42vw, 520px)" }} />
              <div className="flex-shrink-0 w-[calc(50%-6px)] rounded-xl bg-gray-100 animate-pulse" style={{ height: "clamp(220px, 42vw, 520px)" }} />
            </div>
          </div>
        }>
          <FeaturedHero />
        </Suspense>

        <div className="px-4 sm:px-8 max-w-[1800px] mx-auto space-y-8">

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

          {/* VideoGrid — Tubi style white sections */}
          <VideoGrid sections={[
            ...(newReleases.length > 0 ? [{ title: "Nouveautés", videos: newReleases.map(toVideo) }] : []),
            ...(movies.length > 0 ? [{ title: "Films", href: "/browse?type=movie", videos: movies.map(toVideo) }] : []),
            ...(teachings.length > 0 ? [{ title: "Enseignements", href: "/browse?type=teaching", videos: teachings.map(toVideo) }] : []),
            ...(series.length > 0 ? [{ title: "Séries", href: "/browse?type=series", videos: series.map(toVideo) }] : []),
            ...(kidsContent.length > 0 ? [{ title: "Enfants", href: "/kids", videos: kidsContent.map(toVideo) }] : []),
            ...dynamicRows.map((row) => ({
              title: `${row.emoji} ${row.title}`,
              href: `/browse?tag=${encodeURIComponent(row.tag)}`,
              videos: row.items.map(toVideo),
            })),
          ] satisfies Section[]} />
        </div>
      </div>
    </div>
  );
}
