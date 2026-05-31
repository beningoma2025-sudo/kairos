import Link from "next/link";
import { ChevronRight } from "lucide-react";
import VideoCard from "./VideoCard";
import type { Section } from "@/types/video";

interface Props {
  section: Section;
}

export default function SectionRow({ section }: Props) {
  if (section.videos.length === 0) return null;

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {section.href ? (
            <Link
              href={section.href}
              className="flex items-center gap-0.5 group/title"
            >
              <h2 className="text-[20px] font-bold text-white group-hover/title:text-white/80 transition-colors">
                {section.title}
              </h2>
              <ChevronRight size={18} className="text-white/60 mt-0.5" />
            </Link>
          ) : (
            <h2 className="text-[20px] font-bold text-white">{section.title}</h2>
          )}
        </div>

        {section.href && (
          <Link
            href={section.href}
            className="text-sm text-white/40 hover:text-white transition-colors font-medium"
          >
            Voir tout
          </Link>
        )}
      </div>

      {/* 5 colonnes exactement comme Tubi */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {section.videos.map((video, i) => (
          <VideoCard key={video.id} video={video} index={i} />
        ))}
      </div>
    </div>
  );
}
