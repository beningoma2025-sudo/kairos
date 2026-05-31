import Link from "next/link";
import Image from "next/image";
import { Play, Info } from "lucide-react";
import { getFeatured } from "@/lib/data/content";

export async function FeaturedHero() {
  const featured = await getFeatured(5);
  const hero = featured[0];

  if (!hero) {
    return (
      <div className="h-[70vh] flex items-center justify-center bg-kairo-dark-card">
        <p className="text-white/40">No featured content available</p>
      </div>
    );
  }

  return (
    <div className="relative h-[75vh] min-h-[500px] overflow-hidden">
      {hero.backdropUrl || hero.thumbnailUrl ? (
        <Image
          src={hero.backdropUrl ?? hero.thumbnailUrl}
          alt={hero.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-kairo-dark to-purple-950" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-kairo-dark via-kairo-dark/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-kairo-dark via-transparent to-transparent" />

      <div className="absolute inset-0 flex items-end pb-20 px-8 max-w-[1800px] mx-auto">
        <div className="max-w-xl">
          <span className="inline-block text-xs font-bold tracking-widest text-kairo-gold uppercase mb-3">
            {hero.type.replace("_", " ")}
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight mb-4">
            {hero.title}
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-8 line-clamp-3">
            {hero.description}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={`/watch/${hero.id}`}
              className="flex items-center gap-2 bg-white hover:bg-white/90 text-kairo-dark font-bold px-6 py-3 rounded-lg transition-all"
            >
              <Play size={18} fill="currentColor" />
              Play Now
            </Link>
            <Link
              href={`/watch/${hero.id}`}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-lg backdrop-blur-sm transition-all"
            >
              <Info size={18} />
              More Info
            </Link>
          </div>
          <div className="flex items-center gap-3 mt-5 text-sm text-white/50">
            <span className="border border-white/30 px-1.5 py-0.5 rounded text-xs font-mono">
              {hero.ageRating}
            </span>
            {hero.releaseYear && <span>{hero.releaseYear}</span>}
            {hero.duration && (
              <span>{Math.floor(hero.duration / 60)}m</span>
            )}
          </div>
        </div>
      </div>

      {featured.length > 1 && (
        <div className="absolute bottom-6 right-8 hidden xl:flex gap-2">
          {featured.slice(1, 4).map((item) => (
            <Link
              key={item.id}
              href={`/watch/${item.id}`}
              className="relative w-28 aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-kairo-gold/60 transition-all"
            >
              <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" sizes="112px" />
              <div className="absolute inset-0 bg-black/30 hover:bg-black/10 transition-all" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
