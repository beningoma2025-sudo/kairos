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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-0.5">
          {section.href ? (
            <Link href={section.href} className="flex items-center gap-0.5 group/title">
              <h2 className="text-[20px] font-bold text-[#111] group-hover/title:text-[#444] transition-colors">
                {section.title}
              </h2>
              <ChevronRight size={18} className="text-[#aaa] mt-0.5" />
            </Link>
          ) : (
            <h2 className="text-[20px] font-bold text-[#111]">{section.title}</h2>
          )}
        </div>
        {section.href && (
          <Link href={section.href} className="text-sm text-[#999] hover:text-[#111] transition-colors font-medium">
            Voir tout
          </Link>
        )}
      </div>

      {/* 5 colonnes comme Tubi */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {section.videos.map((video, i) => (
          <VideoCard key={video.id} video={video} index={i} />
        ))}
      </div>
    </div>
  );
}
