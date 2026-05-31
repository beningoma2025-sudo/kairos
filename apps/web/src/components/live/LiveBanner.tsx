import Link from "next/link";
import { Radio } from "lucide-react";
import { getLiveEvents } from "@/lib/data/content";

export async function LiveBanner() {
  const events = await getLiveEvents();
  const live = events.find((e) => e.status === "LIVE");
  if (!live) return null;

  return (
    <Link href={`/live/${live.id}`}
      className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 hover:border-red-500/50 transition-all group">
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <Radio size={15} className="text-red-400" />
        <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Live</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-red-300 transition-colors">
          {live.title}
        </p>
        {live.channel && (
          <p className="text-xs text-white/40 truncate">{live.channel.name}</p>
        )}
      </div>
      <span className="text-white/30 text-xs shrink-0">Watch now →</span>
    </Link>
  );
}
