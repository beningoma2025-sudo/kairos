import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio, Calendar } from "lucide-react";
import type { LiveEvent } from "@kairo/types";

export const metadata: Metadata = {
  title: "Live",
  description: "Join prayer gatherings, worship sessions, and faith conferences in real time.",
};

async function fetchLiveData(): Promise<{ liveNow: LiveEvent[]; upcoming: LiveEvent[] }> {
  const API_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.API_URL ?? "http://localhost:3000");
  try {
    const res = await fetch(`${API_URL}/api/live`, { next: { revalidate: 30 } });
    if (!res.ok) return { liveNow: [], upcoming: [] };
    return res.json() as Promise<{ liveNow: LiveEvent[]; upcoming: LiveEvent[] }>;
  } catch {
    return { liveNow: [], upcoming: [] };
  }
}

export default async function LivePage() {
  const { liveNow, upcoming } = await fetchLiveData();

  return (
    <div className="min-h-screen bg-kairo-dark px-8 py-10 max-w-[1800px] mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold text-white mb-2">Live Now</h1>
        <p className="text-white/50">Real-time faith experiences from around the world.</p>
      </div>

      {/* Live Now */}
      {liveNow.length > 0 ? (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </div>
            <span className="text-red-400 text-sm font-bold tracking-widest uppercase">
              Streaming Now
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {liveNow.map((event) => (
              <LiveEventCard key={event.id} event={event} isLive />
            ))}
          </div>
        </section>
      ) : (
        <div className="mb-12 p-8 rounded-2xl border border-kairo-dark-border bg-kairo-dark-card text-center">
          <Radio size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No live events right now.</p>
          <p className="text-white/25 text-sm mt-1">Check upcoming events below.</p>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={16} className="text-kairo-gold" />
            <h2 className="text-xl font-semibold text-white">Upcoming Events</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {upcoming.map((event) => (
              <LiveEventCard key={event.id} event={event} isLive={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LiveEventCard({ event, isLive }: { event: LiveEvent; isLive: boolean }) {
  const start = new Date(event.scheduledStartAt);

  return (
    <Link
      href={`/live/${event.id}`}
      className="group block rounded-2xl overflow-hidden border border-kairo-dark-border bg-kairo-dark-card hover:border-kairo-gold/40 transition-all duration-300"
    >
      <div className="relative aspect-video">
        <Image
          src={event.thumbnailUrl}
          alt={event.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 gradient-overlay" />

        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}

        {event.viewerCount > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 text-white/80 text-xs px-2 py-1 rounded-md backdrop-blur-sm">
            {event.viewerCount.toLocaleString()} watching
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-white font-semibold text-sm mb-1 group-hover:text-kairo-gold transition-colors line-clamp-2">
          {event.title}
        </p>
        {!isLive && (
          <p className="text-white/40 text-xs">
            {start.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </Link>
  );
}
