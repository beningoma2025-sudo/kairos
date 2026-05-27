"use client";

import { useCallback, useRef } from "react";
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
  const { saveProgress } = useProgressTracking(contentId, userId);
  const lastSavedRef = useRef(0);

  // Callback ref so we can attach native DOM events to the MuxPlayer element
  const playerRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;

      const handleTimeUpdate = () => {
        const video = node.shadowRoot?.querySelector("video") ?? (node as HTMLVideoElement);
        const current = Math.floor(video.currentTime ?? 0);
        if (Math.abs(current - lastSavedRef.current) >= 15) {
          lastSavedRef.current = current;
          saveProgress(current);
        }
      };

      const handleEnded = () => {
        saveProgress(-1);
        onEnded?.();
      };

      node.addEventListener("timeupdate", handleTimeUpdate);
      node.addEventListener("ended", handleEnded);

      return () => {
        node.removeEventListener("timeupdate", handleTimeUpdate);
        node.removeEventListener("ended", handleEnded);
      };
    },
    [saveProgress, onEnded]
  );

  return (
    <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <MuxPlayer
        ref={playerRef as any}
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
