import Link from "next/link";
import { Radio } from "lucide-react";
import type { LiveEvent } from "@kairo/types";

async function fetchLiveNow(): Promise<LiveEvent[]> {
  const API_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.API_URL ?? "http://localhost:3000");
  try {
    const res = await fetch(`${API_URL}/api/live`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { liveNow: LiveEvent[] };
    return json.liveNow ?? [];
  } catch {
    return [];
  }
}

export async function LiveBanner() {
  const liveEvents = await fetchLiveNow();
  if (liveEvents.length === 0) return null;

  const event = liveEvents[0]!;

  return (
    <Link
      href={`/live/${event.id}`}
      className="flex items-center gap-4 px-5 py-4 rounded-xl border border-red-500/30
                 bg-red-950/20 hover:bg-red-950/30 hover:border-red-500/50
                 transition-all duration-200 group"
    >
      {/* Live indicator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </div>
        <span className="text-red-400 text-xs font-bold tracking-widest uppercase">Live</span>
      </div>

      <div className="w-px h-8 bg-white/10" />

      <Radio size={16} className="text-white/40 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate group-hover:text-kairo-gold transition-colors">
          {event.title}
        </p>
        {event.viewerCount > 0 && (
          <p className="text-white/40 text-xs">
            {event.viewerCount.toLocaleString()} watching now
          </p>
        )}
      </div>

      <span className="text-white/40 text-sm group-hover:text-kairo-gold transition-colors flex-shrink-0">
        Watch →
      </span>
    </Link>
  );
}
