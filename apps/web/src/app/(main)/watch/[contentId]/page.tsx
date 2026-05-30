import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { UniversalPlayer } from "@/components/player/UniversalPlayer";
import { ContentMeta } from "@/components/content/ContentMeta";
import { RelatedContent } from "@/components/content/RelatedContent";
import { getContentById } from "@/lib/api/content";

interface WatchPageProps {
  params: Promise<{ contentId: string }>;
  searchParams: Promise<{ t?: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { contentId } = await params;
  const content = await getContentById(contentId);

  if (!content) return { title: "Not Found" };

  return {
    title: content.title,
    description: content.description,
    openGraph: {
      title: content.title,
      description: content.description,
      images: [content.thumbnailUrl],
    },
  };
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { contentId } = await params;
  const { t: startTime } = await searchParams;
  const { userId } = await auth();

  const content = await getContentById(contentId);

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-kairo-dark">
      {/* Player - full width, dark bg */}
      <div className="w-full bg-black">
        <UniversalPlayer
          content={content}
          startTimeSeconds={startTime ? parseInt(startTime, 10) : undefined}
          userId={userId ?? undefined}
        />
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <ContentMeta content={content} />
        </div>
        <div>
          <RelatedContent contentId={content.id} type={content.type} />
        </div>
      </div>
    </div>
  );
}
