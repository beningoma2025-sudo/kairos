"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { ContentCard } from "@/components/content/ContentCard";
import { cn } from "@/lib/utils";
import type { Content, ContentType } from "@kairo/types";

const CONTENT_TYPES: { label: string; value: ContentType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Movies", value: "movie" },
  { label: "Series", value: "series" },
  { label: "Documentaries", value: "documentary" },
  { label: "Teachings", value: "teaching" },
  { label: "Kids", value: "kids" },
  { label: "Short", value: "short" },
];

interface SearchInterfaceProps {
  searchParamsPromise: Promise<{ q?: string }>;
}

export function SearchInterface({ searchParamsPromise }: SearchInterfaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [activeType, setActiveType] = useState<ContentType | "all">("all");
  const [results, setResults] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Run search on mount if q param present
  useEffect(() => {
    if (initialQ) void search(initialQ, "all");
  }, []);

  const search = async (q: string, type: ContentType | "all") => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: q, limit: "24" });
      if (type !== "all") params.set("type", type);
      const res = await fetch(`/api/content?${params.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as { data: Content[] };
        setResults(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = (value: string) => {
    setQuery(value);
    startTransition(() => {
      const url = value ? `/search?q=${encodeURIComponent(value)}` : "/search";
      router.replace(url, { scroll: false });
    });
    void search(value, activeType);
  };

  const handleType = (type: ContentType | "all") => {
    setActiveType(type);
    void search(query, type);
  };

  return (
    <div>
      {/* Search input */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          placeholder="Search movies, series, teachings…"
          autoFocus
          className="w-full bg-kairo-dark-card border border-kairo-dark-border rounded-2xl
                     pl-12 pr-12 py-4 text-white placeholder:text-white/30
                     focus:outline-none focus:border-kairo-gold text-lg transition-all"
        />
        {query && (
          <button
            onClick={() => handleQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {CONTENT_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => handleType(t.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
              activeType === t.value
                ? "bg-kairo-gold text-kairo-dark border-kairo-gold"
                : "border-kairo-dark-border text-white/60 hover:border-white/30"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video rounded-xl bg-kairo-dark-muted mb-2" />
              <div className="h-3 bg-kairo-dark-muted rounded w-3/4 mb-1" />
              <div className="h-3 bg-kairo-dark-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-white/40 text-sm mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        </>
      )}

      {!loading && query && results.length === 0 && (
        <div className="text-center py-20">
          <Search size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-white/25 text-sm mt-2">Try a different keyword or category.</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-20">
          <Search size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30">Start typing to search the library</p>
        </div>
      )}
    </div>
  );
}
