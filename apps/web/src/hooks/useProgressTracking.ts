"use client";

import { useCallback, useRef } from "react";

export function useProgressTracking(contentId: string, userId?: string) {
  const lastSaved = useRef<number>(0);

  const saveProgress = useCallback(
    async (progressSeconds: number) => {
      if (!userId) return;
      if (Math.abs(progressSeconds - lastSaved.current) < 10 && progressSeconds !== -1) return;

      lastSaved.current = progressSeconds;
      const isCompleted = progressSeconds === -1;

      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentId,
            progressSeconds: isCompleted ? lastSaved.current : progressSeconds,
            completed: isCompleted,
          }),
        });
      } catch {
        // Silent — progress sync is best-effort
      }
    },
    [contentId, userId]
  );

  return { saveProgress };
}
