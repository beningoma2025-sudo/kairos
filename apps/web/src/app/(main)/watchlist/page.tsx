import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@kairo/database";
import { BookmarkX } from "lucide-react";
import { WatchlistGrid } from "@/components/content/WatchlistGrid";
import type { Content } from "@kairo/types";

export const metadata: Metadata = {
  title: "My Watchlist",
  description: "Content you've saved to watch later.",
};

export default async function WatchlistPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) redirect("/sign-in");

  const items = await prisma.watchlistItem.findMany({
    where: { userId: user.id },
    orderBy: { addedAt: "desc" },
    include: {
      content: {
        select: {
          id: true,
          title: true,
          type: true,
          thumbnailUrl: true,
          duration: true,
          ageRating: true,
          isKids: true,
          description: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-kairo-dark px-8 py-10 max-w-[1800px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white">My Watchlist</h1>
        <p className="text-white/40 text-sm mt-1">
          {items.length > 0
            ? `${items.length} title${items.length !== 1 ? "s" : ""} saved`
            : "Nothing saved yet"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-kairo-dark-card border border-kairo-dark-border flex items-center justify-center">
            <BookmarkX size={28} className="text-white/20" />
          </div>
          <p className="text-white/40 text-center">
            Your watchlist is empty.
            <br />
            Browse content and hit <span className="text-kairo-gold">+</span> to save for later.
          </p>
          <a
            href="/browse"
            className="px-5 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors"
          >
            Browse content
          </a>
        </div>
      ) : (
        <WatchlistGrid
          items={items.map((i) => ({
            id: i.content.id,
            title: i.content.title,
            // Prisma returns uppercase ContentType ("MOVIE"), types package uses lowercase ("movie")
            type: i.content.type.toLowerCase() as Content["type"],
            thumbnailUrl: i.content.thumbnailUrl,
            duration: i.content.duration ?? undefined,
            ageRating: i.content.ageRating as Content["ageRating"],
            isKidsContent: i.content.isKids,
            addedAt: i.addedAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
