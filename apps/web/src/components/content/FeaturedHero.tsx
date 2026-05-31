"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import type { ContentItem } from "@/lib/data/content";

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

function FeaturedCard({ item }: { item: ContentItem }) {
  const typeLabel = TYPE_LABELS[item.type] ?? item.type;

  return (
    <Link
      href={`/watch/${item.id}`}
      className="relative flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(50%-8px)] overflow-hidden rounded-xl group"
      style={{ height: "clamp(220px, 42vw, 520px)" }}
    >
      {/* Background image */}
      <Image
        src={item.backdropUrl ?? item.thumbnailUrl}
        alt={item.title}
        fill
        priority
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        sizes="(max-width: 768px) 90vw, 50vw"
      />

      {/* Gradient overlay — bottom 55% */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
      {/* Side gradient — subtle */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex items-end justify-between gap-4">

        {/* Left: info */}
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-white/60 text-xs font-medium">
              {typeLabel}
            </span>
            {item.releaseYear && (
              <>
                <span className="text-white/30 text-xs">·</span>
                <span className="text-white/60 text-xs">{item.releaseYear}</span>
              </>
            )}
            {item.duration && (
              <>
                <span className="text-white/30 text-xs">·</span>
                <span className="text-white/60 text-xs">
                  {Math.floor(item.duration / 3600) > 0
                    ? `${Math.floor(item.duration / 3600)}h ${Math.floor((item.duration % 3600) / 60)}m`
                    : `${Math.floor(item.duration / 60)}m`}
                </span>
              </>
            )}
            <span className="border border-white/30 text-white/60 text-[9px] font-mono px-1.5 py-0.5 rounded leading-none">
              {item.ageRating}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-white font-bold leading-tight mb-2 line-clamp-2"
            style={{ fontSize: "clamp(14px, 2vw, 26px)" }}>
            {item.title}
          </h2>

          {/* Description */}
          <p className="text-white/55 text-xs sm:text-sm leading-relaxed line-clamp-2 hidden sm:block">
            {item.description}
          </p>
        </div>

        {/* Right: play button */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-kairo-gold flex items-center justify-center shadow-2xl shadow-kairo-gold/30 group-hover:bg-kairo-gold-light transition-colors duration-200">
            <Play size={20} className="text-kairo-dark ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
    </Link>
  );
}

interface FeaturedHeroClientProps {
  items: ContentItem[];
}

export function FeaturedHeroClient({ items }: FeaturedHeroClientProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (items.length === 0) return null;

  const updateScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth * 0.5 + 12;
    el.scrollBy({ left: dir === "right" ? cardWidth : -cardWidth, behavior: "smooth" });
  };

  return (
    <div className="relative group/hero px-4 sm:px-8 max-w-[1800px] mx-auto">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          aria-label="Précédent"
          className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-all shadow-xl opacity-0 group-hover/hero:opacity-100"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          aria-label="Suivant"
          className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-all shadow-xl opacity-0 group-hover/hero:opacity-100"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Cards strip */}
      <div
        ref={scrollRef}
        onScroll={updateScroll}
        className="flex gap-3 overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <FeaturedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

/* ── Server wrapper (kept for backward compat) ─────────────── */
import { getFeatured } from "@/lib/data/content";

export async function FeaturedHero() {
  const items = await getFeatured(6);
  return <FeaturedHeroClient items={items} />;
}
