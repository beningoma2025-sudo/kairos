"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Plus, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Content } from "@kairo/types";

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
    setSaved(next); // optimistic
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
      setSaved(!next); // revert on error
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("content-card group relative", className)}>
      <Link href={`/watch/${content.id}`}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-xl">
          <Image
            src={content.thumbnailUrl}
            alt={content.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                <Play size={18} className="text-kairo-dark ml-0.5" fill="currentColor" />
              </div>
            </div>
          </div>

          {/* Age rating badge */}
          <div className="absolute top-2 left-2 bg-black/60 text-white/80 text-xs px-1.5 py-0.5 rounded font-mono">
            {content.ageRating}
          </div>

          {/* Duration */}
          {content.duration && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white/80 text-xs px-1.5 py-0.5 rounded font-mono">
              {formatDuration(content.duration)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-white text-sm font-medium truncate group-hover:text-kairo-gold transition-colors">
            {content.title}
          </h3>
          <p className="text-white/40 text-xs mt-0.5 capitalize">
            {content.type.replace("_", " ")}
          </p>
        </div>
      </Link>

      {/* Watchlist button */}
      <button
        onClick={toggleWatchlist}
        disabled={pending}
        title={saved ? "Remove from watchlist" : "Add to watchlist"}
        className={cn(
          "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center",
          "border transition-all duration-200",
          "opacity-0 group-hover:opacity-100",
          saved
            ? "bg-kairo-gold border-kairo-gold text-kairo-dark opacity-100"
            : "bg-kairo-dark-card border-kairo-dark-border text-white/70 hover:border-kairo-gold hover:text-white"
        )}
      >
        {saved ? <Check size={12} strokeWidth={3} /> : <Plus size={13} />}
      </button>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
