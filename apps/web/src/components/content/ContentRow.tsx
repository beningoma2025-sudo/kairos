"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard } from "./ContentCard";
import type { Content } from "@kairo/types";

interface ContentRowProps {
  title: string;
  endpoint: string;
  linkHref?: string;
  linkLabel?: string;
  accentColor?: string;
}

// Server-side fetch wrapper — rendered as a client component to support
// horizontal scroll interaction, but data is fetched on mount.
export function ContentRow({ title, endpoint, linkHref, linkLabel }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items] = useState<Content[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <ContentRowInner
      title={title}
      endpoint={endpoint}
      linkHref={linkHref}
      linkLabel={linkLabel}
    />
  );
}

// Async server component for data fetching
async function ContentRowInner({
  title,
  endpoint,
  linkHref,
  linkLabel,
}: ContentRowProps) {
  const API_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.API_URL ?? "http://localhost:3000");
  let items: Content[] = [];

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      next: { revalidate: 120 },
    });
    if (res.ok) {
      const json = (await res.json()) as { data: Content[] };
      items = json.data ?? [];
    }
  } catch {
    // Silently degrade — row simply won't render
  }

  if (items.length === 0) return null;

  return <ContentRowClient title={title} items={items} linkHref={linkHref} linkLabel={linkLabel} />;
}

function ContentRowClient({
  title,
  items,
  linkHref,
  linkLabel,
}: {
  title: string;
  items: Content[];
  linkHref?: string;
  linkLabel?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
      {/* Row header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        {linkHref && (
          <Link
            href={linkHref}
            className="text-sm text-kairo-gold hover:text-kairo-gold-light font-medium transition-colors"
          >
            {linkLabel ?? "See all"} →
          </Link>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10
                       w-10 h-10 rounded-full bg-kairo-dark-card border border-kairo-dark-border
                       flex items-center justify-center text-white shadow-xl
                       opacity-0 group-hover/row:opacity-100 transition-opacity hover:border-kairo-gold"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10
                       w-10 h-10 rounded-full bg-kairo-dark-card border border-kairo-dark-border
                       flex items-center justify-center text-white shadow-xl
                       opacity-0 group-hover/row:opacity-100 transition-opacity hover:border-kairo-gold"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-52">
              <ContentCard content={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
