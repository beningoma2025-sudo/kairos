"use client";

import { useEffect, useRef, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { useProgressTracking } from "@/hooks/useProgressTracking";

interface ContentForPlayer {
  id: string;
  title: string;
  sourceType: string;
  muxPlaybackId?: string | null;
  embedUrl?: string | null;
  streamUrl?: string | null;
  sourceUrl?: string | null;
  providerContentId?: string | null;
  provider?: { name: string; logoUrl?: string | null } | null;
}

interface UniversalPlayerProps {
  content: ContentForPlayer;
  startTimeSeconds?: number;
  userId?: string;
  onEnded?: () => void;
}

// ── YouTube helper ────────────────────────────────────────────
function getYouTubeEmbedUrl(content: ContentForPlayer): string {
  const videoId =
    content.providerContentId ??
    extractYouTubeId(content.sourceUrl ?? content.embedUrl ?? "");
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&color=white`;
}

function extractYouTubeId(url: string): string {
  const match =
    url.match(/[?&]v=([^&#]+)/) ??
    url.match(/youtu\.be\/([^?&#]+)/) ??
    url.match(/embed\/([^?&#]+)/);
  return match?.[1] ?? "";
}

// ── Vimeo helper ──────────────────────────────────────────────
function getVimeoEmbedUrl(content: ContentForPlayer): string {
  const videoId =
    content.providerContentId ??
    extractVimeoId(content.sourceUrl ?? content.embedUrl ?? "");
  return `https://player.vimeo.com/video/${videoId}?autoplay=1&color=C9A84C&byline=0&portrait=0`;
}

function extractVimeoId(url: string): string {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] ?? "";
}

// ── iFrame Player (YouTube, Vimeo, Embed) ────────────────────
function IframePlayer({
  src,
  title,
  contentId,
  userId,
  onEnded,
}: {
  src: string;
  title: string;
  contentId: string;
  userId?: string;
  onEnded?: () => void;
}) {
  const { saveProgress } = useProgressTracking(contentId, userId);
  const startedAt = useRef<number>(Date.now());
  const savedSeconds = useRef(0);

  // Track elapsed time via interval (cross-origin iFrames block events)
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      if (elapsed - savedSeconds.current >= 15) {
        savedSeconds.current = elapsed;
        saveProgress(elapsed);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  return (
    <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    </div>
  );
}

// ── HLS / Direct Stream Player ────────────────────────────────
function StreamPlayer({
  src,
  title,
  contentId,
  userId,
  startTimeSeconds,
  onEnded,
}: {
  src: string;
  title: string;
  contentId: string;
  userId?: string;
  startTimeSeconds?: number;
  onEnded?: () => void;
}) {
  const { saveProgress } = useProgressTracking(contentId, userId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (startTimeSeconds) video.currentTime = startTimeSeconds;

    const onTimeUpdate = () => {
      const cur = Math.floor(video.currentTime);
      if (Math.abs(cur - lastSaved.current) >= 15) {
        lastSaved.current = cur;
        saveProgress(cur);
      }
    };
    const onVideoEnded = () => {
      saveProgress(-1);
      onEnded?.();
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onVideoEnded);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onVideoEnded);
    };
  }, [saveProgress, startTimeSeconds, onEnded]);

  return (
    <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
      <video
        ref={videoRef}
        src={src}
        title={title}
        controls
        autoPlay
        className="w-full h-full bg-black"
        style={{ maxHeight: "80vh" }}
      />
    </div>
  );
}

// ── Main UniversalPlayer ──────────────────────────────────────
export function UniversalPlayer({
  content,
  startTimeSeconds = 0,
  userId,
  onEnded,
}: UniversalPlayerProps) {
  const { saveProgress } = useProgressTracking(content.id, userId);
  const lastSavedRef = useRef(0);

  // ── MUX (default) ────────────────────────────────────────
  if (content.sourceType === "MUX" || !content.sourceType) {
    if (!content.muxPlaybackId) {
      return <PlayerError message="Vidéo en cours de traitement…" />;
    }

    const playerRef = (node: HTMLElement | null) => {
      if (!node) return;
      const onTimeUpdate = () => {
        const video =
          node.shadowRoot?.querySelector("video") ?? (node as HTMLVideoElement);
        const cur = Math.floor(video.currentTime ?? 0);
        if (Math.abs(cur - lastSavedRef.current) >= 15) {
          lastSavedRef.current = cur;
          saveProgress(cur);
        }
      };
      const onVideoEnded = () => { saveProgress(-1); onEnded?.(); };
      node.addEventListener("timeupdate", onTimeUpdate);
      node.addEventListener("ended", onVideoEnded);
      return () => {
        node.removeEventListener("timeupdate", onTimeUpdate);
        node.removeEventListener("ended", onVideoEnded);
      };
    };

    return (
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MuxPlayer
          ref={playerRef as any}
          playbackId={content.muxPlaybackId}
          streamType="on-demand"
          title={content.title}
          startTime={startTimeSeconds}
          accentColor="#C9A84C"
          style={{ width: "100%", height: "100%" }}
          metadata={{ video_id: content.id, video_title: content.title, viewer_user_id: userId }}
        />
      </div>
    );
  }

  // ── YOUTUBE ───────────────────────────────────────────────
  if (content.sourceType === "YOUTUBE") {
    return (
      <IframePlayer
        src={getYouTubeEmbedUrl(content)}
        title={content.title}
        contentId={content.id}
        userId={userId}
        onEnded={onEnded}
      />
    );
  }

  // ── VIMEO ─────────────────────────────────────────────────
  if (content.sourceType === "VIMEO") {
    return (
      <IframePlayer
        src={getVimeoEmbedUrl(content)}
        title={content.title}
        contentId={content.id}
        userId={userId}
        onEnded={onEnded}
      />
    );
  }

  // ── EMBED (code iframe du partenaire) ─────────────────────
  if (content.sourceType === "EMBED" && content.embedUrl) {
    return (
      <IframePlayer
        src={content.embedUrl}
        title={content.title}
        contentId={content.id}
        userId={userId}
        onEnded={onEnded}
      />
    );
  }

  // ── API_STREAM (HLS/MP4 direct) ───────────────────────────
  if (content.sourceType === "API_STREAM" && content.streamUrl) {
    return (
      <StreamPlayer
        src={content.streamUrl}
        title={content.title}
        contentId={content.id}
        userId={userId}
        startTimeSeconds={startTimeSeconds}
        onEnded={onEnded}
      />
    );
  }

  return <PlayerError message="Source vidéo non disponible pour ce contenu." />;
}

function PlayerError({ message }: { message: string }) {
  return (
    <div
      className="relative w-full flex items-center justify-center bg-kairo-dark-card text-white/40 text-sm"
      style={{ aspectRatio: "16/9" }}
    >
      {message}
    </div>
  );
}
