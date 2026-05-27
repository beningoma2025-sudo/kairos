"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Plus, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Content } from "@kairo/types";

interface ContentCardProps {
  content: Pick<Content, "id" | "title" | "type" | "thumbnailUrl" | "duration" | "ageRating" | "isKidsContent">;
  className?: string;
}

export function ContentCard({ content, className }: ContentCardProps) {
  return (
    <div className={cn("content-card group", className)}>
      <Link href={`/watch/${content.id}`}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
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

      {/* Action buttons (visible on hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
        <button
          className="w-7 h-7 rounded-full bg-kairo-dark-card border border-kairo-dark-border flex items-center justify-center text-white/70 hover:text-white hover:border-kairo-gold transition-all"
          aria-label="Add to watchlist"
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
