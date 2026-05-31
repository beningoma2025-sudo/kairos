"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import type { Video } from "@/types/video";

interface Props {
  video: Video;
  index?: number;
}

export default function VideoCard({ video, index = 0 }: Props) {
  return (
    <div
      className="group relative"
      style={{
        animation: `fadeInUp 0.4s ease both`,
        animationDelay: `${index * 60}ms`,
      }}
    >
      <Link href={video.videoUrl} className="block">

        {/* ── Poster 2/3 ───────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-lg bg-[#e8e8e8]" style={{ aspectRatio: "2/3" }}>

          <Image
            src={video.poster}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 14vw"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center">
            {/* Play button */}
            <div className="w-[54px] h-[54px] rounded-full bg-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Play size={22} className="text-black ml-0.5" fill="currentColor" />
            </div>

            {/* Duration + rating at bottom */}
            {(video.duration || video.rating) && (
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {video.duration && (
                  <span className="text-white text-[10px] font-medium bg-black/60 px-1.5 py-0.5 rounded">
                    {video.duration}
                  </span>
                )}
                {video.rating && (
                  <span className="text-white text-[10px] font-medium border border-white/60 px-1.5 py-0.5 rounded">
                    {video.rating}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* "Bientôt retiré" badge */}
          {video.leavingSoon && (
            <div className="absolute top-2 left-2 bg-[#fa3c4c] text-white text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
              Bientôt retiré
            </div>
          )}
        </div>

        {/* ── Title below ──────────────────────────────────── */}
        <p className="mt-1.5 text-[12px] text-[#555] truncate leading-snug px-0.5">
          {video.title}
        </p>

      </Link>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
