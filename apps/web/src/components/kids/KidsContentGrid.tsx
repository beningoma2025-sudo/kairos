import Link from "next/link";
import Image from "next/image";
import type { Content } from "@kairo/types";

type AgeGroup = "2-5" | "6-9" | "10-13";

const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  "2-5": "Little Ones · Ages 2–5",
  "6-9": "Kids · Ages 6–9",
  "10-13": "Tweens · Ages 10–13",
};

const AGE_GROUP_COLORS: Record<AgeGroup, string> = {
  "2-5": "from-yellow-500/20 to-orange-500/10",
  "6-9": "from-blue-500/20 to-cyan-500/10",
  "10-13": "from-purple-500/20 to-pink-500/10",
};

async function fetchKidsContent(ageGroup: AgeGroup): Promise<Content[]> {
  const API_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.API_URL ?? "http://localhost:3000");
  try {
    const res = await fetch(
      `${API_URL}/api/content?kids=true&ageGroup=${ageGroup}&limit=12`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Content[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function KidsContentGrid({ ageGroup }: { ageGroup: AgeGroup }) {
  const items = await fetchKidsContent(ageGroup);

  if (items.length === 0) return null;

  return (
    <section>
      <div
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${AGE_GROUP_COLORS[ageGroup]} text-white/80 text-sm font-semibold mb-5`}
      >
        {AGE_GROUP_LABELS[ageGroup]}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/watch/${item.id}`}
            className="group block"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-kairo-dark-card border border-kairo-dark-border transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-kairo-gold/30">
              <Image
                src={item.thumbnailUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 15vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
            </div>
            <p className="mt-2 text-white/80 text-sm font-medium text-center truncate group-hover:text-kairo-gold transition-colors">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
