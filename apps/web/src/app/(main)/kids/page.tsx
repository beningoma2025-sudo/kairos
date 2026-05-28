import type { Metadata } from "next";
import { Suspense } from "react";
import { KidsClientWrapper } from "@/components/kids/KidsClientWrapper";
import { KidsContentGrid } from "@/components/kids/KidsContentGrid";
import { ContentRowSkeleton } from "@/components/ui/Skeletons";

export const metadata: Metadata = {
  title: "Kairo Kids",
  description: "Safe, faith-based entertainment for children ages 2–13.",
};

export default function KidsPage() {
  return (
    <KidsClientWrapper>
      <div className="px-8 py-10 space-y-10 max-w-[1800px] mx-auto">
        {(["2-5", "6-9", "10-13"] as const).map((group) => (
          <Suspense key={group} fallback={<ContentRowSkeleton title={`Ages ${group}`} />}>
            <KidsContentGrid ageGroup={group} />
          </Suspense>
        ))}
      </div>
    </KidsClientWrapper>
  );
}
