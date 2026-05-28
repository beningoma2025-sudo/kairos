"use client";

import { cn } from "@/lib/utils";

interface Badge {
  id: string;
  emoji: string;
  label: string;
  description: string;
  threshold: number;
}

const BADGES: Badge[] = [
  {
    id: "first_story",
    emoji: "⭐",
    label: "First Story",
    description: "Watched your first video",
    threshold: 1,
  },
  {
    id: "story_lover",
    emoji: "📖",
    label: "Story Lover",
    description: "Completed 5 videos",
    threshold: 5,
  },
  {
    id: "explorer",
    emoji: "🔭",
    label: "Explorer",
    description: "Completed 10 videos",
    threshold: 10,
  },
  {
    id: "faith_hero",
    emoji: "✝️",
    label: "Faith Hero",
    description: "Completed 25 videos",
    threshold: 25,
  },
];

interface Props {
  completedCount: number;
  compact?: boolean;
}

export function KidsBadges({ completedCount, compact = false }: Props) {
  const earned = BADGES.filter((b) => completedCount >= b.threshold);
  const earnedIds = new Set(earned.map((b) => b.id));

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {BADGES.map((badge) => {
          const isEarned = earnedIds.has(badge.id);
          return (
            <div
              key={badge.id}
              title={isEarned ? `${badge.label}: ${badge.description}` : `${badge.description} to unlock`}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-base transition-all",
                isEarned
                  ? "bg-kairo-gold/10 ring-1 ring-kairo-gold/30"
                  : "opacity-25 grayscale"
              )}
            >
              {badge.emoji}
            </div>
          );
        })}
        {earned.length > 0 && (
          <span className="text-white/40 text-xs ml-1">
            {earned.length}/{BADGES.length}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
        Badges ({earned.length}/{BADGES.length})
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {BADGES.map((badge) => {
          const isEarned = earnedIds.has(badge.id);
          return (
            <div
              key={badge.id}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                isEarned
                  ? "bg-kairo-gold/5 border-kairo-gold/20"
                  : "bg-kairo-dark-muted border-kairo-dark-border opacity-40"
              )}
            >
              <span className={cn("text-2xl", !isEarned && "grayscale")}>{badge.emoji}</span>
              <span className="text-[11px] font-semibold text-white text-center leading-tight">
                {badge.label}
              </span>
              <span className="text-[10px] text-white/40 text-center leading-tight">
                {badge.description}
              </span>
              {isEarned && (
                <span className="text-[10px] text-kairo-gold font-bold">Earned!</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Next badge progress */}
      {earned.length < BADGES.length && (() => {
        const next = BADGES.find((b) => completedCount < b.threshold);
        if (!next) return null;
        const prev = BADGES[BADGES.indexOf(next) - 1];
        const from = prev?.threshold ?? 0;
        const pct = Math.min(((completedCount - from) / (next.threshold - from)) * 100, 100);
        return (
          <div className="mt-2 p-3 rounded-xl bg-kairo-dark-muted border border-kairo-dark-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50">Next: {next.label} {next.emoji}</span>
              <span className="text-xs text-white/40">
                {completedCount}/{next.threshold} videos
              </span>
            </div>
            <div className="h-1.5 bg-kairo-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-kairo-gold rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
