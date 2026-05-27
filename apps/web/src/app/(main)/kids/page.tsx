import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { KidsHero } from "@/components/kids/KidsHero";
import { KidsContentGrid } from "@/components/kids/KidsContentGrid";
import { ContentRowSkeleton } from "@/components/ui/Skeletons";

export const metadata: Metadata = {
  title: "Kairo Kids",
  description: "Safe, faith-based entertainment for children ages 2–13.",
};

export default async function KidsPage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0A0A0F 100%)" }}>
      <KidsHero />

      <div className="px-8 py-10 space-y-10 max-w-[1800px] mx-auto">
        {(["2-5", "6-9", "10-13"] as const).map((group) => (
          <Suspense
            key={group}
            fallback={
              <ContentRowSkeleton title={`Ages ${group}`} />
            }
          >
            <KidsContentGrid ageGroup={group} />
          </Suspense>
        ))}
      </div>
    </div>
  );
}
