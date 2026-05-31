"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard } from "./ContentCard";
import type { ContentItem } from "@/lib/data/content";

interface ContentRowClientProps {
  title: string;
  items: ContentItem[];
  linkHref?: string;
  linkLabel?: string;
  grid?: boolean;
}

export function ContentRowClient({ title, items, linkHref, linkLabel, grid }: ContentRowClientProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (items.length === 0) return null;

  /* ── Grid mode (filtered category page) ──────────────────── */
  if (grid) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-3 gap-y-6">
        {items.map((item) => (
          <ContentCard key={item.id} content={item as never} />
        ))}
      </div>
    );
  }

  /* ── Horizontal scroll row ────────────────────────────────── */
  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? el.clientWidth * 0.85 : -el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="group/row">

      {/* ── Row header — Tubi style: "Title >" ─────────────── */}
      <div className="flex items-center mb-3">
        {linkHref ? (
          <Link href={linkHref} className="flex items-center gap-0.5 group/title">
            <h2 className="text-white font-bold text-[15px] sm:text-base tracking-tight group-hover/title:text-white/80 transition-colors">
              {title}
            </h2>
            <ChevronRight
              size={17}
              className="text-white/50 group-hover/title:text-white/80 mt-px transition-colors"
            />
          </Link>
        ) : (
          <h2 className="text-white font-bold text-[15px] sm:text-base tracking-tight">{title}</h2>
        )}
      </div>

      {/* ── Scroll strip ───────────────────────────────────── */}
      <div className="relative">

        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Défiler à gauche"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-8 h-8 rounded-full bg-[#1a1a2e]/90 border border-white/10 text-white flex items-center justify-center hover:bg-[#1a1a2e] hover:border-white/30 transition-all shadow-lg opacity-0 group-hover/row:opacity-100 duration-200"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Défiler à droite"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-8 h-8 rounded-full bg-[#1a1a2e]/90 border border-white/10 text-white flex items-center justify-center hover:bg-[#1a1a2e] hover:border-white/30 transition-all shadow-lg opacity-0 group-hover/row:opacity-100 duration-200"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Cards strip */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-[175px] sm:w-[210px] md:w-[235px] lg:w-[255px]">
              <ContentCard content={item as never} />
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
