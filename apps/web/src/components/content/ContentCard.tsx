"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Plus, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Content } from "@kairo/types";

const TYPE_LABELS: Record<string, string> = {
  MOVIE:       "Film",
  DOCUMENTARY: "Documentaire",
  TEACHING:    "Enseignement",
  SERIES:      "Série",
  SHORT:       "Court-métrage",
  KIDS:        "Enfants",
  EPISODE:     "Épisode",
  LIVE_EVENT:  "En direct",
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

  const typeLabel = TYPE_LABELS[content.type] ?? content.type;

  return (
    <div className={cn("group", className)}>
      <Link href={`/watch/${content.id}`} className="block">

        {/* ── Poster — format 2:3 comme Tubi ───────────────── */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-[5px] bg-[#1a1a2e]">
          <Image
            src={content.thumbnailUrl}
            alt={content.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 22vw, 16vw"
          />

          {/* Hover: veil + play button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xl opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
              <Play size={18} className="text-black ml-0.5" fill="currentColor" />
            </div>
          </div>

          {/* Watchlist button — top right on hover */}
          <button
            onClick={toggleWatchlist}
            disabled={pending}
            aria-label={saved ? "Retirer" : "Ajouter à ma liste"}
            className={cn(
              "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center border",
              "transition-all duration-150 opacity-0 group-hover:opacity-100",
              saved
                ? "bg-kairo-gold border-kairo-gold text-kairo-dark"
                : "bg-black/60 border-white/30 text-white hover:border-white"
            )}
          >
            {saved ? <Check size={11} strokeWidth={3} /> : <Plus size={13} />}
          </button>
        </div>

        {/* ── Info sous la carte ────────────────────────────── */}
        <div className="mt-1.5 px-0.5">
          <p className="text-white text-[12px] font-medium leading-snug line-clamp-2 group-hover:text-white/75 transition-colors">
            {content.title}
          </p>
          <p className="text-white/40 text-[10px] mt-0.5 leading-none">
            {typeLabel}{content.duration ? ` · ${formatDuration(content.duration)}` : ""}
          </p>
        </div>

      </Link>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
