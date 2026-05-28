"use client";

import { useEffect, useState, useRef } from "react";
import { X, Flame, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Badge {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  earned: boolean;
}

interface Level {
  name: string;
  xp: number;
  nextLevelXP: number;
  progress: number;
}

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  totalMinutes: number;
  level: Level;
  badges: Badge[];
}

interface Props {
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

export function GamificationPanel({ onClose, anchorRef }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/gamification/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Stats | null) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose, anchorRef]);

  const earnedBadges = stats?.badges.filter((b) => b.earned) ?? [];
  const nextBadge = stats?.badges.find((b) => !b.earned);

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute top-full right-0 mt-2 w-80 z-50",
        "bg-kairo-dark-card border border-kairo-dark-border rounded-2xl shadow-2xl shadow-black/50",
        "animate-slide-up"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-kairo-dark-border">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          <span className="text-sm font-semibold text-white">Faith Journey</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-white/30 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {loading ? (
        <div className="px-4 py-8 flex justify-center gap-1.5">
          <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      ) : !stats ? (
        <p className="px-4 py-6 text-center text-white/40 text-sm">Start watching to track your journey.</p>
      ) : (
        <div className="px-4 py-4 space-y-4">
          {/* Streak + Level row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current streak */}
            <div className="bg-kairo-dark-muted rounded-xl p-3 text-center">
              <div className="text-3xl font-bold text-orange-400 flex items-center justify-center gap-1">
                <Flame size={20} className="text-orange-400" />
                {stats.currentStreak}
              </div>
              <p className="text-xs text-white/50 mt-1">Day Streak</p>
              <p className="text-[10px] text-white/25 mt-0.5">Best: {stats.longestStreak}</p>
            </div>

            {/* Level + XP */}
            <div className="bg-kairo-dark-muted rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={14} className="text-kairo-gold shrink-0" />
                <span className="text-sm font-bold text-white">{stats.level.name}</span>
              </div>
              <p className="text-[11px] text-white/40 mb-2">
                {stats.level.xp} / {stats.level.nextLevelXP} XP
              </p>
              <div className="h-1.5 bg-kairo-dark-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold-gradient rounded-full transition-all duration-700"
                  style={{ width: `${stats.level.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 text-center">
            <div className="flex-1 bg-kairo-dark-muted rounded-xl py-2.5">
              <p className="text-lg font-bold text-white">{stats.totalCompletions}</p>
              <p className="text-[10px] text-white/40">Videos</p>
            </div>
            <div className="flex-1 bg-kairo-dark-muted rounded-xl py-2.5">
              <p className="text-lg font-bold text-white">
                {stats.totalMinutes >= 60
                  ? `${Math.floor(stats.totalMinutes / 60)}h`
                  : `${stats.totalMinutes}m`}
              </p>
              <p className="text-[10px] text-white/40">Watched</p>
            </div>
            <div className="flex-1 bg-kairo-dark-muted rounded-xl py-2.5">
              <p className="text-lg font-bold text-white">{earnedBadges.length}</p>
              <p className="text-[10px] text-white/40">Badges</p>
            </div>
          </div>

          {/* Badges */}
          <div>
            <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-2.5">
              Achievements
            </p>
            <div className="grid grid-cols-4 gap-2">
              {stats.badges.map((badge) => (
                <div
                  key={badge.id}
                  title={badge.earned ? `${badge.label}: ${badge.desc}` : `${badge.desc} to unlock`}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all",
                    badge.earned
                      ? "bg-kairo-gold/5 border-kairo-gold/20"
                      : "border-kairo-dark-border opacity-30 grayscale"
                  )}
                >
                  <span className="text-xl leading-none">{badge.emoji}</span>
                  <span className="text-[9px] text-white/70 leading-tight">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next badge progress */}
          {nextBadge && (
            <div className="bg-kairo-dark-muted rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={13} className="text-kairo-gold" />
                <span className="text-xs text-white/60">
                  Next: <span className="text-white font-medium">{nextBadge.label}</span>{" "}
                  {nextBadge.emoji}
                </span>
              </div>
              <p className="text-[11px] text-white/30">{nextBadge.desc}</p>
            </div>
          )}

          {stats.currentStreak === 0 && (
            <p className="text-center text-xs text-white/30 pb-1">
              Watch something today to start your streak 🔥
            </p>
          )}
        </div>
      )}
    </div>
  );
}
