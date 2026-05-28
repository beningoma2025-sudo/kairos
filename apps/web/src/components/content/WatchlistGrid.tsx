"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ContentCard } from "./ContentCard";
import { cn } from "@/lib/utils";
import type { Content } from "@kairo/types";

type WatchlistContent = Pick<
  Content,
  "id" | "title" | "type" | "thumbnailUrl" | "duration" | "ageRating" | "isKidsContent"
> & { addedAt: string };

export function WatchlistGrid({ items: initial }: { items: WatchlistContent[] }) {
  const [items, setItems] = useState(initial);

  async function remove(contentId: string) {
    setItems((prev) => prev.filter((i) => i.id !== contentId));
    await fetch(`/api/watchlist/${contentId}`, { method: "DELETE" }).catch(() => {});
  }

  if (items.length === 0) {
    return (
      <p className="text-white/30 text-center py-12 text-sm">
        All items removed.{" "}
        <a href="/browse" className="text-kairo-gold hover:underline">
          Browse more content
        </a>
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item) => (
        <div key={item.id} className="relative group/item">
          <ContentCard content={item} initialSaved />
          <button
            onClick={() => remove(item.id)}
            title="Remove from watchlist"
            className={cn(
              "absolute bottom-14 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10",
              "bg-kairo-dark-card border border-kairo-dark-border text-white/30",
              "opacity-0 group-hover/item:opacity-100 transition-all",
              "hover:text-red-400 hover:border-red-500/30"
            )}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
