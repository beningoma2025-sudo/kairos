"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Genre {
  key: string;
  label: string;
  emoji: string;
  href: string;
  count: number;
  isType: boolean;
}

export function GenreBar() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const searchParams = useSearchParams();
  const activeType = searchParams.get("type");
  const activeTag = searchParams.get("tag");

  useEffect(() => {
    fetch("/api/genres")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { types: Genre[]; tags: Genre[] } | null) => {
        if (!data) return;
        // Types first, then tags — deduplicated
        const all = [...data.types, ...data.tags];
        setGenres(all);
      })
      .catch(() => {});
  }, []);

  const updateScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  };

  if (genres.length === 0) return null;

  return (
    <div className="relative group/bar w-full">
      {/* Left arrow */}
      {canLeft && (
        <button onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-kairo-dark/90 border border-kairo-dark-border flex items-center justify-center text-white opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-lg">
          <ChevronLeft size={15} />
        </button>
      )}
      {/* Right arrow */}
      {canRight && (
        <button onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-kairo-dark/90 border border-kairo-dark-border flex items-center justify-center text-white opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-lg">
          <ChevronRight size={15} />
        </button>
      )}

      <div ref={scrollRef} onScroll={updateScroll}
        className="flex items-center gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>

        {/* "All" chip */}
        <Link href="/browse"
          className={cn(
            "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border",
            !activeType && !activeTag
              ? "bg-white text-[#0f0f1a] border-white"
              : "bg-transparent border-white/20 text-white/60 hover:text-white hover:border-white/50"
          )}>
          🏠 Tout
        </Link>

        {genres.map((g) => {
          const isActive = g.isType
            ? activeType === g.href.split("type=")[1]
            : activeTag === g.href.split("tag=")[1];

          return (
            <Link key={g.key} href={g.href}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap",
                isActive
                  ? "bg-white text-[#0f0f1a] border-white font-semibold"
                  : "bg-transparent border-white/20 text-white/60 hover:text-white hover:border-white/50"
              )}>
              <span>{g.emoji}</span>
              {g.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
