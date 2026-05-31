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
  grid?: boolean; // show as grid instead of horizontal scroll
}

export function ContentRowClient({ title, items, linkHref, linkLabel, grid }: ContentRowClientProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (items.length === 0) return null;

  // Grid mode — full-page category view
  if (grid) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {items.map((item) => (
          <ContentCard key={item.id} content={item as never} />
        ))}
      </div>
    );
  }

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? el.clientWidth * 0.8 : -el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="group/row">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        {linkHref && (
          <Link href={linkHref} className="text-sm text-kairo-gold hover:text-kairo-gold-light font-medium transition-colors">
            {linkLabel ?? "See all"} →
          </Link>
        )}
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-kairo-dark-card border border-kairo-dark-border flex items-center justify-center text-white shadow-xl opacity-0 group-hover/row:opacity-100 transition-opacity hover:border-kairo-gold">
            <ChevronLeft size={18} />
          </button>
        )}
        {canScrollRight && (
          <button onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-kairo-dark-card border border-kairo-dark-border flex items-center justify-center text-white shadow-xl opacity-0 group-hover/row:opacity-100 transition-opacity hover:border-kairo-gold">
            <ChevronRight size={18} />
          </button>
        )}

        <div ref={scrollRef} onScroll={updateScrollState}
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {items.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-52">
              <ContentCard content={item as never} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
