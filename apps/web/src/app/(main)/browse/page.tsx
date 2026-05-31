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
        <a href={href(page - 1)} className="flex items-center gap-1 px-3 py-2 rounded-md bg-kairo-dark-card border border-kairo-dark-border text-white/70 text-sm hover:border-kairo-gold hover:text-white transition-all">
          <ChevronLeft size={14} /> Préc.
        </a>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 rounded-md text-white/20 text-sm cursor-not-allowed select-none">
          <ChevronLeft size={14} /> Préc.
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-white/30 text-sm select-none">
            …
          </span>
        ) : p === page ? (
          <span key={p} className="w-9 h-9 flex items-center justify-center rounded-md bg-kairo-gold text-kairo-dark font-bold text-sm">
            {p}
          </span>
        ) : (
          <a key={p} href={href(p)} className="w-9 h-9 flex items-center justify-center rounded-md bg-kairo-dark-card border border-kairo-dark-border text-white/60 text-sm hover:border-kairo-gold hover:text-white transition-all">
            {p}
          </a>
        )
      )}

      {/* Suivant */}
      {page < totalPages ? (
        <a href={href(page + 1)} className="flex items-center gap-1 px-3 py-2 rounded-md bg-kairo-dark-card border border-kairo-dark-border text-white/70 text-sm hover:border-kairo-gold hover:text-white transition-all">
          Suiv. <ChevronRight size={14} />
        </a>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 rounded-md text-white/20 text-sm cursor-not-allowed select-none">
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
      <div className="min-h-screen bg-kairo-dark pt-24 px-8 pb-16 max-w-[1800px] mx-auto">
        <div className="mb-6">
          <Suspense fallback={null}>
            <GenreBar />
          </Suspense>
        </div>

        <div className="flex items-baseline gap-4 mb-6">
          <h1 className="text-2xl font-display font-bold text-white">{title}</h1>
          <span className="text-white/40 text-sm">{total} vidéos</span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-white/25">
            <p className="text-lg mb-2">Aucun contenu dans cette catégorie</p>
            <p className="text-sm">Utilise Admin → Import Archive pour ajouter du contenu</p>
          </div>
        ) : (
          <>
            <ContentRowClient title="" items={items} grid />

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
    <div className="min-h-screen bg-kairo-dark">

      <div className="pt-24 pb-8 space-y-8">

        {/* ── Tubi-style featured cards hero ───────────────── */}
        <Suspense fallback={
          <div className="px-4 sm:px-8 max-w-[1800px] mx-auto">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-[calc(50%-6px)] rounded-xl bg-kairo-dark-card animate-pulse" style={{ height: "clamp(220px, 42vw, 520px)" }} />
              <div className="flex-shrink-0 w-[calc(50%-6px)] rounded-xl bg-kairo-dark-card animate-pulse" style={{ height: "clamp(220px, 42vw, 520px)" }} />
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

          {/* Content rows */}
          {newReleases.length > 0 && <ContentRowClient title="Nouveautés" items={newReleases} />}
          {movies.length > 0 && <ContentRowClient title="Films" items={movies} linkHref="/browse?type=movie" linkLabel="Voir tout" />}
          {teachings.length > 0 && <ContentRowClient title="Enseignements" items={teachings} linkHref="/browse?type=teaching" linkLabel="Voir tout" />}
          {series.length > 0 && <ContentRowClient title="Séries" items={series} linkHref="/browse?type=series" linkLabel="Voir tout" />}
          {kidsContent.length > 0 && <ContentRowClient title="Enfants" items={kidsContent} linkHref="/kids" linkLabel="Voir tout" />}

          {/* Dynamic rows from imported categories */}
          {dynamicRows.map((row) => (
            <ContentRowClient
              key={row.title}
              title={`${row.emoji} ${row.title}`}
              items={row.items}
              linkHref={`/browse?tag=${encodeURIComponent(row.tag)}`}
              linkLabel="Voir tout"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
