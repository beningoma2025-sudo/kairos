"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Film, Radio, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  imageUrl: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  new_content: Film,
  live_event:  Radio,
  streak:      Zap,
  system:      Info,
};

const TYPE_COLOR: Record<string, string> = {
  new_content: "text-blue-400 bg-blue-500/10",
  live_event:  "text-red-400 bg-red-500/10",
  streak:      "text-orange-400 bg-orange-500/10",
  system:      "text-kairo-gold bg-kairo-gold/10",
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.read).length;

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) setNotifs(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) void load(); }}
        className="p-2 rounded-full text-white/70 hover:text-white transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-kairo-gold rounded-full flex items-center justify-center text-[9px] font-bold text-kairo-dark">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-kairo-dark-card border border-kairo-dark-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-kairo-dark-border">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-kairo-gold transition-colors"
              >
                <CheckCheck size={13} /> Tout lire
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-kairo-dark-border/50">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/25">
                <Bell size={24} className="mb-2 opacity-30" />
                <p className="text-xs">Aucune notification</p>
              </div>
            ) : (
              notifs.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                const color = TYPE_COLOR[n.type] ?? "text-white/40 bg-white/5";
                return (
                  <div
                    key={n.id}
                    onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                    className={cn(
                      "flex gap-3 px-4 py-3 cursor-pointer hover:bg-kairo-dark-muted/40 transition-colors",
                      !n.read && "bg-kairo-gold/3"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", color)}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-semibold truncate", n.read ? "text-white/60" : "text-white")}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-white/35 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-white/20 mt-1">{formatRelativeDate(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-kairo-gold shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
