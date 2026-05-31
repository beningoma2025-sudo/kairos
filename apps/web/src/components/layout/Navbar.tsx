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

interface Genre {
  key: string; label: string; emoji: string; href: string; count: number; isType: boolean;
}

// Main nav items — always visible
const MAIN_LINKS = [
  { label: "Home",   href: "/browse" },
  { label: "Movies", href: "/browse?type=movie" },
  { label: "Series", href: "/browse?type=series" },
  { label: "Kids",   href: "/kids" },
  { label: "Live",   href: "/live" },
  { label: "Church", href: "/browse?type=teaching" },
] as const;

function CategoriesDropdown({ genres }: { genres: Genre[] }) {
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

  if (genres.length === 0) return null;

  // Separate types vs tags
  const types = genres.filter((g) => g.isType);
  const tags = genres.filter((g) => !g.isType);

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
        <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-[520px] bg-kairo-dark-card/95 backdrop-blur-xl border border-kairo-dark-border rounded-2xl shadow-2xl p-5 z-50">
          {/* Content types */}
          {types.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mb-2.5">Type de contenu</p>
              <div className="grid grid-cols-3 gap-1.5">
                {types.map((g) => (
                  <Link key={g.key} href={g.href} onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-kairo-dark-muted transition-colors group">
                    <span className="text-base">{g.emoji}</span>
                    <div>
                      <p className="text-xs font-medium text-white/80 group-hover:text-white">{g.label}</p>
                      <p className="text-[10px] text-white/25">{g.count} titres</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tag genres */}
          {tags.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mb-2.5">Genres</p>
              <div className="grid grid-cols-3 gap-1.5">
                {tags.map((g) => (
                  <Link key={g.key} href={g.href} onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-kairo-dark-muted transition-colors group">
                    <span className="text-base">{g.emoji}</span>
                    <div>
                      <p className="text-xs font-medium text-white/80 group-hover:text-white">{g.label}</p>
                      <p className="text-[10px] text-white/25">{g.count} titres</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
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
  const [genres, setGenres] = useState<Genre[]>([]);
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
      .then((data: { types: Genre[]; tags: Genre[] } | null) => {
        if (data) setGenres([...data.types, ...data.tags]);
      })
      .catch(() => {});
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/browse" && !searchParams.get("type") && !searchParams.get("tag") && pathname === "/browse") return true;
    if (href.includes("?type=")) return searchParams.get("type") === href.split("type=")[1];
    if (href === "/kids") return pathname === "/kids";
    if (href === "/live") return pathname === "/live";
    return false;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16">
      <div className="absolute inset-0 bg-gradient-to-b from-kairo-dark/95 to-transparent pointer-events-none" />

      <nav className="relative flex items-center justify-between px-8 h-full max-w-[1800px] mx-auto">
        {/* Logo */}
        <Link href="/browse" className="flex items-center gap-1.5 mr-8 shrink-0">
          <span className="text-xl font-display font-bold text-white tracking-tight">KAIRO</span>
          <span className="text-kairo-gold text-xs">✦</span>
        </Link>

        {/* Nav Links */}
        <ul className="hidden md:flex items-center gap-0.5">
          {MAIN_LINKS.map((link) => (
            <li key={link.label}>
              <Link href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive(link.href) ? "text-white" : "text-white/60 hover:text-white"
                )}>
                {link.label}
              </Link>
            </li>
          ))}

          {/* Categories dropdown */}
          <li>
            <CategoriesDropdown genres={genres} />
          </li>
        </ul>

        {/* Right Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <Link href="/search"
            className="p-2 rounded-full text-white/70 hover:text-white transition-colors"
            aria-label="Search">
            <Search size={18} />
          </Link>

          <Link href="/watchlist"
            className={cn(
              "p-2 rounded-full transition-colors",
              pathname === "/watchlist" ? "text-kairo-gold" : "text-white/70 hover:text-white"
            )}
            aria-label="My Watchlist">
            <Bookmark size={18} />
          </Link>

          <NotificationsPanel />

          {/* Streak */}
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
            {showPanel && (
              <GamificationPanel onClose={() => setShowPanel(false)} anchorRef={streakBtnRef} />
            )}
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
