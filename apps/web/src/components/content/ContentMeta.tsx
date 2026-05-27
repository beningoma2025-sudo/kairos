"use client";

import { useState } from "react";
import { ThumbsUp, Plus, Check, Share2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import type { Content } from "@kairo/types";

interface ContentMetaProps {
  content: Content;
}

export function ContentMeta({ content }: ContentMetaProps) {
  const { user } = useUser();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(content.likeCount);

  const toggleWatchlist = async () => {
    if (!user) {
      toast.error("Sign in to save content");
      return;
    }
    setInWatchlist((prev) => !prev);
    toast.success(inWatchlist ? "Removed from watchlist" : "Added to watchlist");

    await fetch("/api/watchlist", {
      method: inWatchlist ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: content.id }),
    }).catch(() => {
      setInWatchlist((prev) => !prev);
    });
  };

  const toggleLike = async () => {
    if (!user) {
      toast.error("Sign in to like content");
      return;
    }
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: content.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const hours = Math.floor((content.duration ?? 0) / 3600);
  const minutes = Math.floor(((content.duration ?? 0) % 3600) / 60);

  return (
    <div>
      {/* Title + badges */}
      <div className="mb-4">
        <h1 className="text-3xl font-display font-bold text-white mb-2">{content.title}</h1>
        <div className="flex items-center gap-3 text-sm text-white/50">
          {content.releaseYear && <span>{content.releaseYear}</span>}
          {content.duration && (
            <span>
              {hours > 0 ? `${hours}h ` : ""}
              {minutes}m
            </span>
          )}
          <span className="border border-white/20 px-1.5 py-0.5 rounded text-xs font-mono text-white/60">
            {content.ageRating}
          </span>
          <span className="capitalize text-white/40">
            {content.type.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={toggleWatchlist}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-kairo-dark-border
                     hover:border-kairo-gold text-white/70 hover:text-white transition-all text-sm font-medium"
        >
          {inWatchlist ? (
            <>
              <Check size={15} className="text-kairo-gold" /> In Watchlist
            </>
          ) : (
            <>
              <Plus size={15} /> Watchlist
            </>
          )}
        </button>

        <button
          onClick={toggleLike}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-kairo-dark-border
                     hover:border-kairo-gold text-white/70 hover:text-white transition-all text-sm font-medium"
        >
          <ThumbsUp size={15} className={liked ? "text-kairo-gold fill-kairo-gold" : ""} />
          {likeCount > 0 && <span>{likeCount.toLocaleString()}</span>}
        </button>

        <button
          onClick={share}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-kairo-dark-border
                     hover:border-kairo-gold text-white/70 hover:text-white transition-all text-sm font-medium"
        >
          <Share2 size={15} />
          Share
        </button>
      </div>

      {/* Description */}
      <p className="text-white/70 leading-relaxed mb-6">{content.description}</p>

      {/* Tags */}
      {content.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-kairo-dark-muted text-white/50 text-xs capitalize"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
