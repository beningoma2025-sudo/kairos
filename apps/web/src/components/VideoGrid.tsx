import SectionRow from "./SectionRow";
import type { Section } from "@/types/video";

interface Props {
  sections: Section[];
}

export default function VideoGrid({ sections }: Props) {
  return (
    <div className="bg-[#0f0f1a] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-8 py-9">
        {sections.map((section) => (
          <SectionRow key={section.title} section={section} />
        ))}
      </div>
    </div>
  );
}
