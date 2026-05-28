"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  watchTimeMinutes: number;
  limitMinutes: number;
  compact?: boolean;
}

export function ScreenTimeBar({ watchTimeMinutes, limitMinutes, compact = false }: Props) {
  const isUnlimited = limitMinutes >= 480;
  const pct = isUnlimited ? 0 : Math.min((watchTimeMinutes / limitMinutes) * 100, 100);
  const isNearLimit = pct >= 80;
  const isAtLimit = pct >= 100;

  const remaining = Math.max(limitMinutes - watchTimeMinutes, 0);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Clock size={13} className="text-white/30 shrink-0" />
        <div className="flex-1">
          <div className="h-1 bg-kairo-dark-border rounded-full overflow-hidden">
            {!isUnlimited && (
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isAtLimit ? "bg-red-500" : isNearLimit ? "bg-orange-400" : "bg-kairo-gold"
                )}
                style={{ width: `${pct}%` }}
              />
            )}
          </div>
        </div>
        <span className="text-[11px] text-white/40 shrink-0">
          {isUnlimited
            ? `${watchTimeMinutes}m`
            : isAtLimit
            ? "Limit reached"
            : `${remaining}m left`}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white/50 text-xs">
          <Clock size={13} />
          <span>Screen Time Today</span>
        </div>
        <span
          className={cn(
            "text-xs font-medium",
            isAtLimit ? "text-red-400" : isNearLimit ? "text-orange-400" : "text-white/60"
          )}
        >
          {isUnlimited
            ? `${watchTimeMinutes} min watched`
            : `${watchTimeMinutes} / ${limitMinutes} min`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="h-2 bg-kairo-dark-border rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isAtLimit ? "bg-red-500" : isNearLimit ? "bg-orange-400" : "bg-kairo-gold"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {isAtLimit && (
        <p className="text-xs text-red-400/80 text-center">
          Daily limit reached — time for a break! 🌟
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-orange-400/70 text-center">
          {remaining} minutes remaining today
        </p>
      )}
    </div>
  );
}
