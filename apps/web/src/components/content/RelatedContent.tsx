import Link from "next/link";
import Image from "next/image";
import type { Content, ContentType } from "@kairo/types";

interface RelatedContentProps {
  contentId: string;
  type: ContentType;
}

async function fetchRelated(contentId: string, type: ContentType): Promise<Content[]> {
  const API_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.API_URL ?? "http://localhost:3000");
  try {
    const res = await fetch(
      `${API_URL}/api/content?type=${type.toLowerCase()}&limit=8`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Content[] };
    return (json.data ?? []).filter((c) => c.id !== contentId).slice(0, 6);
  } catch {
    return [];
  }
}

export async function RelatedContent({ contentId, type }: RelatedContentProps) {
  const related = await fetchRelated(contentId, type);

  if (related.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">More Like This</h3>
      <div className="space-y-3">
        {related.map((item) => (
          <Link
            key={item.id}
            href={`/watch/${item.id}`}
            className="flex gap-3 p-2 rounded-lg hover:bg-kairo-dark-card transition-colors group"
          >
            <div className="relative flex-shrink-0 w-32 aspect-video rounded-md overflow-hidden">
              <Image
                src={item.thumbnailUrl}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="128px"
              />
            </div>
            <div className="min-w-0 flex-1 py-1">
              <p className="text-white text-sm font-medium truncate group-hover:text-kairo-gold transition-colors">
                {item.title}
              </p>
              <p className="text-white/40 text-xs mt-0.5">
                {item.duration
                  ? `${Math.floor(item.duration / 60)}m`
                  : item.type.replace("_", " ")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
