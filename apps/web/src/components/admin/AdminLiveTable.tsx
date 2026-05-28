"use client";

import { useEffect, useState } from "react";
import { Radio, Clock, CheckCircle, XCircle, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveEvent {
  id: string;
  title: string;
  status: string;
  scheduledStartAt: string;
  actualStartAt: string | null;
  muxStreamKey: string | null;
  muxPlaybackId: string | null;
  viewerCount: number;
  peakViewerCount: number;
  channel: { name: string; slug: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  SCHEDULED: { label: "Scheduled", cls: "text-blue-400 bg-blue-500/10", icon: Clock },
  LIVE: { label: "Live Now", cls: "text-red-400 bg-red-500/10", icon: Radio },
  ENDED: { label: "Ended", cls: "text-white/30 bg-white/5", icon: CheckCircle },
  CANCELED: { label: "Canceled", cls: "text-white/20 bg-white/5", icon: XCircle },
};

const FALLBACK_STATUS_CFG = { label: "Scheduled", cls: "text-blue-400 bg-blue-500/10", icon: Clock };

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="p-1 rounded text-white/30 hover:text-white transition-colors"
      title="Copy"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
    </button>
  );
}

export function AdminLiveTable() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/live")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: LiveEvent[]) => setEvents(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center gap-1.5 py-16">
        <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl py-16 text-center text-white/30 text-sm">
        No live events yet.{" "}
        <a href="/admin/live/new" className="text-kairo-gold hover:underline">
          Create your first live stream →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-kairo-dark-border">
            {["Event", "Status", "Scheduled", "Viewers", "Stream Key", "Playback ID"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[11px] text-white/30 font-semibold uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const cfg = STATUS_CONFIG[event.status] ?? FALLBACK_STATUS_CFG;
            const StatusIcon = cfg.icon;
            return (
              <tr key={event.id} className="border-b border-kairo-dark-border/50 hover:bg-kairo-dark-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm text-white font-medium">{event.title}</p>
                  {event.channel && (
                    <p className="text-xs text-white/30 mt-0.5">{event.channel.name}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium", cfg.cls)}>
                    <StatusIcon size={11} />
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-white/50">
                  {new Date(event.scheduledStartAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-white/50">
                  {event.status === "LIVE" ? (
                    <span className="text-red-400 font-medium">{event.viewerCount} live</span>
                  ) : (
                    <span>{event.peakViewerCount > 0 ? `${event.peakViewerCount} peak` : "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {event.muxStreamKey ? (
                    <div className="flex items-center gap-1">
                      <code className="text-[10px] text-white/40 font-mono bg-kairo-dark-muted px-2 py-0.5 rounded max-w-[140px] truncate">
                        {event.muxStreamKey}
                      </code>
                      <CopyButton value={event.muxStreamKey} />
                    </div>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {event.muxPlaybackId ? (
                    <div className="flex items-center gap-1">
                      <code className="text-[10px] text-white/40 font-mono bg-kairo-dark-muted px-2 py-0.5 rounded max-w-[120px] truncate">
                        {event.muxPlaybackId}
                      </code>
                      <CopyButton value={event.muxPlaybackId} />
                    </div>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
