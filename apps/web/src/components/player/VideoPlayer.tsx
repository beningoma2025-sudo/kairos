"use client";

import { useEffect, useRef, useCallback } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { useProgressTracking } from "@/hooks/useProgressTracking";

interface VideoPlayerProps {
  contentId: string;
  playbackId: string;
  title: string;
  startTimeSeconds?: number;
  userId?: string;
  onEnded?: () => void;
}

export function VideoPlayer({
  contentId,
  playbackId,
  title,
  startTimeSeconds = 0,
  userId,
  onEnded,
}: VideoPlayerProps) {
  const playerRef = useRef<HTMLElement>(null);
  const { saveProgress } = useProgressTracking(contentId, userId);

  const handleTimeUpdate = useCallback(
    (evt: Event) => {
      const target = evt.target as HTMLVideoElement;
      if (target.currentTime % 15 < 0.5) {
        saveProgress(Math.floor(target.currentTime));
      }
    },
    [saveProgress]
  );

  const handleEnded = useCallback(() => {
    saveProgress(-1);
    onEnded?.();
  }, [saveProgress, onEnded]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    player.addEventListener("timeupdate", handleTimeUpdate);
    player.addEventListener("ended", handleEnded);

    return () => {
      player.removeEventListener("timeupdate", handleTimeUpdate);
      player.removeEventListener("ended", handleEnded);
    };
  }, [handleTimeUpdate, handleEnded]);

  return (
    <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
      <MuxPlayer
        ref={playerRef as React.RefObject<HTMLElement>}
        playbackId={playbackId}
        streamType="on-demand"
        title={title}
        startTime={startTimeSeconds}
        accentColor="#C9A84C"
        style={{ width: "100%", height: "100%" }}
        metadata={{
          video_id: contentId,
          video_title: title,
          viewer_user_id: userId,
        }}
      />
    </div>
  );
}
