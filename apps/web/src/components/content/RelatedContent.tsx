import Link from "next/link";
import Image from "next/image";
import { getRelated } from "@/lib/data/content";

export async function RelatedContent({ contentId, type }: { contentId: string; type: string }) {
  const items = await getRelated(contentId, type, 8);
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">More Like This</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <Link key={item.id} href={`/watch/${item.id}`}
            className="flex gap-3 group hover:bg-kairo-dark-card rounded-xl p-2 transition-colors">
            <div className="relative w-28 shrink-0 aspect-video rounded-lg overflow-hidden bg-kairo-dark-card">
              <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="112px" />
            </div>
            <div className="flex-1 min-w-0 py-1">
              <p className="text-sm text-white font-medium line-clamp-2 group-hover:text-kairo-gold transition-colors">
                {item.title}
              </p>
              {item.duration && (
                <p className="text-xs text-white/30 mt-1">{Math.floor(item.duration / 60)}m</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
