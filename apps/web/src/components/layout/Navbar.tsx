"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Search, Flame, Bookmark, LayoutDashboard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { GamificationPanel } from "@/components/gamification/GamificationPanel";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";

const NAV_LINKS = [
  { label: "Home", href: "/browse" },
  { label: "Movies", href: "/browse?type=movie" },
  { label: "Series", href: "/browse?type=series" },
  { label: "Kids", href: "/kids" },
  { label: "Live", href: "/live" },
  { label: "Church", href: "/browse?type=teaching" },
] as const;

export function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [streak, setStreak] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const streakBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch("/api/gamification/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { currentStreak: number } | null) => {
        if (data) setStreak(data.currentStreak);
      })
      .catch(() => {});
  }, [pathname]); // re-fetch when navigating

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16">
      <div className="absolute inset-0 bg-gradient-to-b from-kairo-dark/95 to-transparent pointer-events-none" />

      <nav className="relative flex items-center justify-between px-8 h-full max-w-[1800px] mx-auto">
        {/* Logo */}
        <Link href="/browse" className="flex items-center gap-1.5 mr-10">
          <span className="text-xl font-display font-bold text-white tracking-tight">KAIRO</span>
          <span className="text-kairo-gold text-xs">✦</span>
        </Link>

        {/* Nav Links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href ||
                    (link.href !== "/browse" && pathname.startsWith(link.href))
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <Link
            href="/search"
            className="p-2 rounded-full text-white/70 hover:text-white transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </Link>

          <Link
            href="/watchlist"
            className={cn(
              "p-2 rounded-full transition-colors",
              pathname === "/watchlist" ? "text-kairo-gold" : "text-white/70 hover:text-white"
            )}
            aria-label="My Watchlist"
          >
            <Bookmark size={18} />
          </Link>

          <NotificationsPanel />

          {/* Streak counter */}
          <div className="relative">
            <button
              ref={streakBtnRef}
              onClick={() => setShowPanel((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-semibold transition-all",
                showPanel
                  ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30"
                  : streak && streak > 0
                  ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                  : "bg-kairo-dark-muted text-white/40 hover:text-white/70"
              )}
              aria-label="Faith Journey"
              title="Faith Journey"
            >
              <Flame size={14} className={cn(streak && streak > 0 ? "text-orange-400" : "text-white/30")} />
              <span className={cn("tabular-nums", streak === null && "opacity-0")}>
                {streak ?? 0}
              </span>
            </button>

            {showPanel && (
              <GamificationPanel
                onClose={() => setShowPanel(false)}
                anchorRef={streakBtnRef}
              />
            )}
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-kairo-gold/10 border border-kairo-gold/20 text-kairo-gold text-xs font-semibold hover:bg-kairo-gold/20 transition-colors"
            >
              <LayoutDashboard size={13} />
              Admin
            </Link>
          )}

          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </nav>
    </header>
  );
}
