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

  /* ── Grid mode (category filtered view) ──────────────────── */
  if (grid) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3">
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
    <section className="group/row -mx-2 px-2">
      {/* Row header */}
      <div className="flex items-center gap-3 mb-3 px-0">
        <h2 className="text-white font-semibold text-base sm:text-lg tracking-tight">{title}</h2>
        {linkHref && (
          <Link
            href={linkHref}
            className="flex items-center gap-0.5 text-xs font-medium text-kairo-gold hover:text-kairo-gold-light transition-colors opacity-0 group-hover/row:opacity-100 duration-200"
          >
            {linkLabel ?? "Voir tout"} <ChevronRight size={13} className="mt-px" />
          </Link>
        )}
      </div>

      {/* Scroll container with edge arrows */}
      <div className="relative">

        {/* Left arrow + fade */}
        <div className={`absolute left-0 top-0 bottom-0 z-20 flex items-center transition-opacity duration-200 ${canScrollLeft ? "opacity-0 group-hover/row:opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-kairo-dark via-kairo-dark/70 to-transparent pointer-events-none" />
          <button
            onClick={() => scroll("left")}
            aria-label="Défiler à gauche"
            className="relative z-10 ml-1 w-9 h-9 rounded-full bg-kairo-dark-card/95 border border-kairo-dark-border text-white flex items-center justify-center hover:border-kairo-gold hover:text-kairo-gold transition-all shadow-xl"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Right arrow + fade */}
        <div className={`absolute right-0 top-0 bottom-0 z-20 flex items-center justify-end transition-opacity duration-200 ${canScrollRight ? "opacity-0 group-hover/row:opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-kairo-dark via-kairo-dark/70 to-transparent pointer-events-none" />
          <button
            onClick={() => scroll("right")}
            aria-label="Défiler à droite"
            className="relative z-10 mr-1 w-9 h-9 rounded-full bg-kairo-dark-card/95 border border-kairo-dark-border text-white flex items-center justify-center hover:border-kairo-gold hover:text-kairo-gold transition-all shadow-xl"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Cards strip */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-44 sm:w-52 md:w-56">
              <ContentCard content={item as never} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
