"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Plus, Check, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Content } from "@kairo/types";

const TYPE_META: Record<string, { label: string; color: string }> = {
  MOVIE:       { label: "Film",          color: "bg-blue-600" },
  DOCUMENTARY: { label: "Documentaire",  color: "bg-amber-600" },
  TEACHING:    { label: "Enseignement",  color: "bg-violet-600" },
  SERIES:      { label: "Série",         color: "bg-emerald-600" },
  SHORT:       { label: "Court",         color: "bg-pink-600" },
  KIDS:        { label: "Enfants",       color: "bg-orange-500" },
  EPISODE:     { label: "Épisode",       color: "bg-teal-600" },
  LIVE_EVENT:  { label: "En direct",     color: "bg-red-600" },
};

interface ContentCardProps {
  content: Pick<Content, "id" | "title" | "type" | "thumbnailUrl" | "duration" | "ageRating" | "isKidsContent">;
  className?: string;
  initialSaved?: boolean;
}

export function ContentCard({ content, className, initialSaved = false }: ContentCardProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggleWatchlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const next = !saved;
    setSaved(next);
    try {
      if (next) {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId: content.id }),
        });
      } else {
        await fetch(`/api/watchlist/${content.id}`, { method: "DELETE" });
      }
    } catch {
      setSaved(!next);
    } finally {
      setPending(false);
    }
  }

  const meta = TYPE_META[content.type] ?? { label: content.type, color: "bg-kairo-dark-muted" };

  return (
    <div className={cn("group relative", className)}>
      <Link href={`/watch/${content.id}`} className="block">
        {/* Card shell — scales on hover */}
        <div className="relative aspect-video overflow-hidden rounded-md transition-all duration-300 ease-out will-change-transform group-hover:scale-[1.06] group-hover:shadow-[0_8px_40px_rgba(0,0,0,0.85)] group-hover:rounded-lg">

          {/* Thumbnail */}
          <Image
            src={content.thumbnailUrl}
            alt={content.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          {/* Permanent bottom gradient — always shows title */}
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

          {/* Hover: stronger darkening veil */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* ── Top row ───────────────────────────────────────── */}
          <div className="absolute top-2 inset-x-2 flex justify-between items-start">
            <span className="bg-black/60 backdrop-blur-[2px] text-white/70 text-[9px] font-mono px-1.5 py-0.5 rounded leading-tight">
              {content.ageRating}
            </span>

            {/* Watchlist button */}
            <button
              onClick={toggleWatchlist}
              disabled={pending}
              aria-label={saved ? "Retirer de la liste" : "Ajouter à la liste"}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center border backdrop-blur-[4px]",
                "transition-all duration-200 opacity-0 group-hover:opacity-100",
                saved
                  ? "bg-kairo-gold border-kairo-gold text-kairo-dark"
                  : "bg-black/50 border-white/25 text-white hover:border-kairo-gold hover:text-kairo-gold"
              )}
            >
              {saved ? <Check size={11} strokeWidth={3} /> : <Plus size={13} />}
            </button>
          </div>

          {/* ── Centre: play button ───────────────────────────── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={cn(
              "w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-2xl",
              "transition-all duration-300 opacity-0 scale-50",
              "group-hover:opacity-100 group-hover:scale-100",
            )}>
              <Play size={20} className="text-kairo-dark ml-0.5" fill="currentColor" />
            </div>
          </div>

          {/* ── Bottom info ───────────────────────────────────── */}
          <div className="absolute bottom-0 inset-x-0 p-2.5 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
            {/* Badge row */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-widest px-1.5 py-[2px] rounded-[3px] text-white leading-none",
                meta.color,
              )}>
                {meta.label}
              </span>
              {content.duration && (
                <span className="flex items-center gap-0.5 text-[9px] text-white/45 font-mono">
                  <Clock size={8} className="flex-shrink-0" />
                  {formatDuration(content.duration)}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-white text-[11px] font-semibold leading-tight line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] group-hover:text-kairo-gold-light transition-colors duration-200">
              {content.title}
            </h3>
          </div>
        </div>
      </Link>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m}m`;
  return `${m}m`;
}
