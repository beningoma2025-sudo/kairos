import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@kairo/database";
import {
  CreditCard,
  Calendar,
  Flame,
  Zap,
  Trophy,
  Clock,
  Film,
  Shield,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your Kairo account, subscription, and spiritual journey.",
};

const PLAN_LABELS: Record<string, { name: string; color: string; bg: string }> = {
  FREE: { name: "Free", color: "text-white/50", bg: "bg-white/5" },
  INDIVIDUAL: { name: "Individual", color: "text-blue-400", bg: "bg-blue-500/10" },
  FAMILY: { name: "Family", color: "text-purple-400", bg: "bg-purple-500/10" },
  CHURCH: { name: "Church", color: "text-kairo-gold", bg: "bg-kairo-gold/10" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "text-green-400" },
  TRIALING: { label: "Trial", color: "text-blue-400" },
  PAST_DUE: { label: "Payment due", color: "text-red-400" },
  CANCELED: { label: "Canceled", color: "text-white/40" },
  PAUSED: { label: "Paused", color: "text-yellow-400" },
};

async function getStats(userId: string) {
  const API_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.API_URL ?? "http://localhost:3000");
  try {
    const res = await fetch(`${API_URL}/api/gamification/stats`, {
      headers: { Cookie: "" }, // Server-side: pass through
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<{
      currentStreak: number;
      longestStreak: number;
      totalCompletions: number;
      totalMinutes: number;
      level: { name: string; xp: number; nextLevelXP: number; progress: number };
      badges: Array<{ id: string; emoji: string; label: string; earned: boolean }>;
    }>;
  } catch {
    return null;
  }
}

export default async function AccountPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const [clerkUser, dbUser] = await Promise.all([
    currentUser(),
    prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        subscription: true,
      },
    }),
  ]);

  if (!dbUser) redirect("/sign-in");

  const stats = await getStats(dbUser.id);
  const DEFAULT_PLAN = { name: "Free", color: "text-white/50", bg: "bg-white/5" };
  const DEFAULT_STATUS = { label: "Active", color: "text-green-400" };
  const plan = PLAN_LABELS[dbUser.subscription?.plan ?? "FREE"] ?? DEFAULT_PLAN;
  const status = STATUS_LABELS[dbUser.subscription?.status ?? "ACTIVE"] ?? DEFAULT_STATUS;
  const earnedBadges = stats?.badges.filter((b) => b.earned) ?? [];

  return (
    <div className="min-h-screen bg-kairo-dark px-8 py-10 max-w-[1000px] mx-auto">
      <h1 className="text-3xl font-display font-bold text-white mb-8">My Account</h1>

      <div className="space-y-5">
        {/* Profile card */}
        <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl p-6 flex items-center gap-5">
          {clerkUser?.imageUrl ? (
            <img
              src={clerkUser.imageUrl}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-kairo-dark-muted flex items-center justify-center text-2xl font-bold text-white/40">
              {dbUser.name[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{dbUser.name}</h2>
            <p className="text-white/40 text-sm">{dbUser.email}</p>
            <p className="text-white/20 text-xs mt-1">
              Member since{" "}
              {dbUser.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${plan.bg} ${plan.color}`}>
            {plan.name}
          </span>
        </div>

        {/* Subscription */}
        <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard size={16} className="text-kairo-gold" />
            <h3 className="font-semibold text-white">Subscription</h3>
          </div>

          {dbUser.subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-white/30 mb-1">Plan</p>
                  <p className={`text-sm font-semibold ${plan.color}`}>{plan.name}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-1">Status</p>
                  <p className={`text-sm font-semibold ${status.color}`}>{status.label}</p>
                </div>
                {dbUser.subscription.currentPeriodEnd && (
                  <div>
                    <p className="text-xs text-white/30 mb-1">
                      {dbUser.subscription.cancelAtPeriodEnd ? "Ends" : "Renews"}
                    </p>
                    <p className="text-sm text-white/70">
                      {new Date(dbUser.subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {dbUser.subscription.trialEnd && (
                  <div>
                    <p className="text-xs text-white/30 mb-1">Trial ends</p>
                    <p className="text-sm text-white/70">
                      {new Date(dbUser.subscription.trialEnd).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>

              {dbUser.subscription.cancelAtPeriodEnd && (
                <div className="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                  Your subscription will end at the current period. You can reactivate anytime.
                </div>
              )}

              <a
                href="/api/billing/portal"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-kairo-dark-border text-white/50 text-sm hover:text-white hover:border-white/20 transition-colors"
              >
                <ExternalLink size={13} />
                Manage billing
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-white/40 text-sm">You&apos;re on the free plan.</p>
              <a
                href="/pricing"
                className="px-4 py-2 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors"
              >
                Upgrade
              </a>
            </div>
          )}
        </div>

        {/* Faith Journey */}
        {stats && (
          <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Flame size={16} className="text-orange-400" />
              <h3 className="font-semibold text-white">Faith Journey</h3>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                {
                  icon: Flame,
                  iconCls: "text-orange-400",
                  value: stats.currentStreak,
                  label: "Day Streak",
                  sub: `Best: ${stats.longestStreak}`,
                },
                {
                  icon: Zap,
                  iconCls: "text-kairo-gold",
                  value: stats.level.name,
                  label: `${stats.level.xp} XP`,
                  sub: `Next: ${stats.level.nextLevelXP} XP`,
                },
                {
                  icon: Film,
                  iconCls: "text-blue-400",
                  value: stats.totalCompletions,
                  label: "Videos",
                  sub: "Completed",
                },
                {
                  icon: Clock,
                  iconCls: "text-purple-400",
                  value:
                    stats.totalMinutes >= 60
                      ? `${Math.floor(stats.totalMinutes / 60)}h`
                      : `${stats.totalMinutes}m`,
                  label: "Watched",
                  sub: "Total",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-kairo-dark-muted rounded-xl p-3 text-center"
                >
                  <stat.icon size={16} className={`${stat.iconCls} mx-auto mb-1.5`} />
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                  <p className="text-[10px] text-white/25">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* XP Progress */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-white/40 mb-1.5">
                <span>{stats.level.name}</span>
                <span>{stats.level.xp} / {stats.level.nextLevelXP} XP</span>
              </div>
              <div className="h-2 bg-kairo-dark-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold-gradient rounded-full transition-all"
                  style={{ width: `${stats.level.progress}%` }}
                />
              </div>
            </div>

            {/* Badges */}
            <div>
              <p className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-3">
                Achievements · {earnedBadges.length}/{stats.badges.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {stats.badges.map((badge) => (
                  <div
                    key={badge.id}
                    title={badge.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                      badge.earned
                        ? "bg-kairo-gold/5 border-kairo-gold/25 text-white"
                        : "border-kairo-dark-border text-white/20 opacity-40 grayscale"
                    }`}
                  >
                    <span>{badge.emoji}</span>
                    <span className="font-medium">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-white/40" />
            <h3 className="font-semibold text-white">Security</h3>
          </div>
          <p className="text-sm text-white/40 mb-4">
            Authentication is managed by Clerk. Use the button below to update your email, password,
            or connected accounts.
          </p>
          <a
            href="https://accounts.clerk.dev/user"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-kairo-dark-border text-white/50 text-sm hover:text-white hover:border-white/20 transition-colors"
          >
            <ExternalLink size={13} />
            Manage security settings
          </a>
        </div>
      </div>
    </div>
  );
}
