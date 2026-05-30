import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";
import { Clock, Film, PlayCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { UniversalPlayer } from "@/components/player/UniversalPlayer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const series = await prisma.series.findUnique({ where: { id }, select: { title: true, description: true, thumbnailUrl: true } });
  if (!series) return { title: "Not Found" };
  return {
    title: `${series.title} | Kairo`,
    description: series.description,
    openGraph: { images: [series.thumbnailUrl] },
  };
}

export default async function SeriesPage({ params }: PageProps) {
  const { id } = await params;
  const { userId: clerkId } = await auth();

  const [series, dbUser] = await Promise.all([
    prisma.series.findUnique({
      where: { id },
      include: {
        channel: { select: { id: true, name: true, slug: true, logoUrl: true } },
        episodes: {
          where: { status: "PUBLISHED" },
          orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
          select: {
            id: true, title: true, description: true, episodeNumber: true,
            seasonNumber: true, duration: true, thumbnailUrl: true,
            sourceType: true, muxPlaybackId: true, embedUrl: true,
            streamUrl: true, sourceUrl: true, providerContentId: true,
            provider: { select: { id: true, name: true, logoUrl: true, slug: true } },
          },
        },
      },
    }),
    clerkId
      ? prisma.user.findUnique({
          where: { clerkId },
          select: { id: true, watchHistory: { select: { contentId: true, completedAt: true } } },
        })
      : null,
  ]);

  if (!series) notFound();

  const completedIds = new Set(
    dbUser?.watchHistory.filter((h) => h.completedAt).map((h) => h.contentId) ?? []
  );

  // Group by season
  const seasons = series.episodes.reduce<Record<number, typeof series.episodes>>((acc, ep) => {
    const s = ep.seasonNumber ?? 1;
    if (!acc[s]) acc[s] = [];
    acc[s].push(ep);
    return acc;
  }, {});

  const firstEp = series.episodes[0];
  const totalDuration = series.episodes.reduce((sum, ep) => sum + (ep.duration ?? 0), 0);

  return (
    <div className="min-h-screen bg-kairo-dark">
      {/* Hero backdrop */}
      <div className="relative w-full h-[60vh] overflow-hidden">
        {series.backdropUrl || series.thumbnailUrl ? (
          <img
            src={series.backdropUrl ?? series.thumbnailUrl}
            alt={series.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-kairo-dark-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-kairo-dark via-kairo-dark/50 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-8 pb-8 max-w-5xl">
          {series.channel && (
            <Link href={`/channels/${series.channel.slug}`} className="flex items-center gap-2 mb-3 w-fit hover:opacity-80 transition-opacity">
              {series.channel.logoUrl && (
                <img src={series.channel.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
              )}
              <span className="text-white/50 text-xs">{series.channel.name}</span>
            </Link>
          )}
          <h1 className="text-4xl font-display font-bold text-white mb-2">{series.title}</h1>
          <div className="flex items-center gap-4 text-white/40 text-sm mb-4">
            <span className="flex items-center gap-1"><Film size={14} /> {series.episodes.length} épisodes</span>
            {totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {Math.floor(totalDuration / 60)}h {totalDuration % 60}m au total
              </span>
            )}
            {series.totalSeasons > 1 && <span>{series.totalSeasons} saisons</span>}
            {series.isComplete && <span className="text-kairo-gold text-xs font-medium px-2 py-0.5 rounded-full bg-kairo-gold/10">Série terminée</span>}
          </div>
          <p className="text-white/60 text-sm max-w-2xl line-clamp-2">{series.description}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Quick play first episode */}
        {firstEp && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-white mb-4">
              {completedIds.has(firstEp.id) ? "Revoir depuis le début" : "Commencer la série"}
            </h2>
            <UniversalPlayer
              content={firstEp as Parameters<typeof UniversalPlayer>[0]["content"]}
              userId={dbUser?.id}
            />
          </div>
        )}

        {/* Episodes by season */}
        {Object.entries(seasons)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([season, episodes]) => (
            <div key={season} className="mb-8">
              {series.totalSeasons > 1 && (
                <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">
                  Saison {season}
                </h2>
              )}
              <div className="space-y-2">
                {episodes.map((ep) => {
                  const done = completedIds.has(ep.id);
                  return (
                    <Link
                      key={ep.id}
                      href={`/watch/${ep.id}`}
                      className="flex items-start gap-4 p-3 rounded-xl hover:bg-kairo-dark-card border border-transparent hover:border-kairo-dark-border transition-all group"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-32 shrink-0 rounded-lg overflow-hidden aspect-video bg-kairo-dark-card">
                        {ep.thumbnailUrl ? (
                          <img src={ep.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film size={18} className="text-white/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <PlayCircle size={24} className="text-white" />
                        </div>
                        {done && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle size={14} className="text-kairo-gold" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-white/30">
                            {ep.episodeNumber ? `Ep. ${ep.episodeNumber}` : ""}
                          </span>
                          {done && <span className="text-[10px] text-kairo-gold">Terminé</span>}
                        </div>
                        <p className="text-sm font-medium text-white group-hover:text-kairo-gold transition-colors truncate">
                          {ep.title}
                        </p>
                        <p className="text-xs text-white/35 mt-1 line-clamp-2">{ep.description}</p>
                        {ep.duration && (
                          <p className="text-[11px] text-white/25 mt-1">
                            {Math.floor(ep.duration / 60)}m {ep.duration % 60}s
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

        {series.episodes.length === 0 && (
          <div className="text-center py-16 text-white/25">
            <Film size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun épisode disponible pour l'instant.</p>
          </div>
        )}
      </div>
    </div>
  );
}
