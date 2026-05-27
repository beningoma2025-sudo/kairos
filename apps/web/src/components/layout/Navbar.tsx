"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Search, Bell, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/browse" },
  { label: "Movies", href: "/browse?type=movie" },
  { label: "Series", href: "/browse?type=series" },
  { label: "Kids", href: "/kids" },
  { label: "Live", href: "/live" },
  { label: "Church", href: "/browse?type=teaching" },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16">
      {/* Gradient background that fades on scroll */}
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
                  pathname === link.href || (link.href !== "/browse" && pathname.startsWith(link.href))
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
        <div className="flex items-center gap-4 ml-auto">
          <Link
            href="/search"
            className="p-2 rounded-full text-white/70 hover:text-white transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </Link>
          <button
            className="p-2 rounded-full text-white/70 hover:text-white transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-kairo-gold rounded-full" />
          </button>
          <UserButton
            afterSignOutUrl="/"
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
