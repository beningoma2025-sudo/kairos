"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Search, Flame, Bookmark, LayoutDashboard, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { GamificationPanel } from "@/components/gamification/GamificationPanel";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";

// Static main nav — always present
const MAIN_LINKS = [
  { label: "Home",          href: "/browse",               exact: true },
  { label: "Movies",        href: "/browse?type=movie",    exact: false },
  { label: "Series",        href: "/browse?type=series",   exact: false },
  { label: "Documentaries", href: "/browse?type=documentary", exact: false },
  { label: "Kids",          href: "/kids",                 exact: true },
  { label: "Live",          href: "/live",                 exact: true },
] as const;

// Static genre categories — always show in dropdown regardless of API
const STATIC_GENRES = [
  { label: "Teachings & Sermons", emoji: "📖", href: "/browse?type=teaching" },
  { label: "Films Bibliques",     emoji: "✝️", href: "/browse?tag=biblical" },
  { label: "Films Chrétiens",     emoji: "🙏", href: "/browse?tag=christian" },
  { label: "Billy Graham",        emoji: "🎤", href: "/browse?tag=billy-graham" },
  { label: "Sermons",             emoji: "📣", href: "/browse?tag=sermon" },
  { label: "Musique Gospel",      emoji: "🎵", href: "/browse?tag=gospel-music" },
  { label: "Worship",             emoji: "🎶", href: "/browse?tag=worship" },
  { label: "Missionnaires",       emoji: "🌍", href: "/browse?tag=missionary" },
  { label: "Histoires Bibliques", emoji: "📚", href: "/browse?tag=bible-stories" },
  { label: "Documentaires",       emoji: "🎞️", href: "/browse?type=documentary" },
  { label: "Shorts",              emoji: "⚡", href: "/browse?type=short" },
  { label: "Évangélisation",      emoji: "🌟", href: "/browse?tag=evangelism" },
] as const;

interface DynamicGenre {
  key: string; label: string; emoji: string; href: string; count: number;
}

function CategoriesDropdown({ dynamic }: { dynamic: DynamicGenre[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Merge static + dynamic (dynamic adds counts to known genres, adds new ones)
  const countMap = Object.fromEntries(dynamic.map((d) => [d.href, d.count]));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          open ? "text-white" : "text-white/60 hover:text-white"
        )}
      >
        Catégories
        <ChevronDown size={13} className={cn("transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-[560px] bg-[#0f0f1a]/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 z-50">
          <div className="grid grid-cols-3 gap-1">
            {STATIC_GENRES.map((g) => {
              const count = countMap[g.href];
              return (
                <Link key={g.href} href={g.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                  <span className="text-xl shrink-0">{g.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white/80 group-hover:text-white truncate">{g.label}</p>
                    {count && count > 0 ? (
                      <p className="text-[10px] text-kairo-gold/70">{count} titres</p>
                    ) : (
                      <p className="text-[10px] text-white/20">Importer</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-[11px] text-white/30">Importe du contenu depuis</p>
            <Link href="/admin/import" onClick={() => setOpen(false)}
              className="text-[11px] text-kairo-gold hover:text-kairo-gold-light font-medium transition-colors">
              Admin → Import Archive →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [streak, setStreak] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [dynamic, setDynamic] = useState<DynamicGenre[]>([]);
  const streakBtnRef = useRef<HTMLButtonElement>(null);

  const role = user?.publicMetadata?.role as string | undefined;
  const isAdmin = role === "SUPER_ADMIN" || role === "CHURCH_ADMIN";

  useEffect(() => {
    fetch("/api/gamification/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { currentStreak: number } | null) => {
        if (data) setStreak(data.currentStreak);
      })
      .catch(() => {});

    fetch("/api/genres")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { types: DynamicGenre[]; tags: DynamicGenre[] } | null) => {
        if (data) setDynamic([...data.types, ...data.tags]);
      })
      .catch(() => {});
  }, [pathname]);

  function isActive(href: string, exact: boolean) {
    if (exact) {
      if (href === "/browse") return pathname === "/browse" && !searchParams.get("type") && !searchParams.get("tag");
      return pathname === href;
    }
    if (href.includes("?type=")) return searchParams.get("type") === href.split("type=")[1];
    if (href.includes("?tag=")) return searchParams.get("tag") === href.split("tag=")[1];
    return pathname.startsWith(href.split("?")[0] ?? href);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-[#e5e5e5]">
      <nav className="flex items-center justify-between px-8 h-full max-w-[1800px] mx-auto">
        {/* Logo */}
        <Link href="/browse" className="flex items-center gap-1 mr-8 shrink-0">
          <span className="text-xl font-bold text-[#fa3c4c] tracking-tight" style={{ fontFamily: "sans-serif" }}>KAIRO</span>
          <span className="text-[#fa3c4c] text-xs">+</span>
        </Link>

        {/* Nav Links */}
        <ul className="hidden lg:flex items-center gap-0.5">
          {MAIN_LINKS.map((link) => (
            <li key={link.label}>
              <Link href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive(link.href, link.exact) ? "text-[#111]" : "text-[#555] hover:text-[#111]"
                )}>
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <CategoriesDropdown dynamic={dynamic} />
          </li>
        </ul>

        {/* Right Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <Link href="/search" className="p-2 rounded-full text-[#555] hover:text-[#111] transition-colors">
            <Search size={18} />
          </Link>
          <Link href="/watchlist"
            className={cn("p-2 rounded-full transition-colors", pathname === "/watchlist" ? "text-[#fa3c4c]" : "text-[#555] hover:text-[#111]")}>
            <Bookmark size={18} />
          </Link>
          <NotificationsPanel />

          <div className="relative">
            <button ref={streakBtnRef} onClick={() => setShowPanel((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-semibold transition-all",
                showPanel ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30"
                  : streak && streak > 0 ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                  : "bg-kairo-dark-muted text-white/40 hover:text-white/70"
              )}>
              <Flame size={14} className={cn(streak && streak > 0 ? "text-orange-400" : "text-white/30")} />
              <span className={cn("tabular-nums", streak === null && "opacity-0")}>{streak ?? 0}</span>
            </button>
            {showPanel && <GamificationPanel onClose={() => setShowPanel(false)} anchorRef={streakBtnRef} />}
          </div>

          {isAdmin && (
            <Link href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-kairo-gold/10 border border-kairo-gold/20 text-kairo-gold text-xs font-semibold hover:bg-kairo-gold/20 transition-colors">
              <LayoutDashboard size={13} />
              Admin
            </Link>
          )}

          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
        </div>
      </nav>
    </header>
  );
}
