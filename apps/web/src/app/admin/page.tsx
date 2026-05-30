export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Film, Users, CreditCard, Clock, TrendingUp, Zap } from "lucide-react";
import { prisma } from "@kairo/database";

export const metadata: Metadata = { title: "Admin Dashboard | Kairo" };

async function getStats() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
    const [totalUsers, newUsers, contentByStatus, activeSubs, watchSecs, contentByType] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.content.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
        prisma.watchHistory.aggregate({ _sum: { progressSeconds: true } }),
        prisma.content.groupBy({ by: ["type"], where: { status: "PUBLISHED" }, _count: { _all: true } }),
      ]);

    const sm = Object.fromEntries(contentByStatus.map((r) => [r.status.toLowerCase(), r._count._all]));
    const tm = Object.fromEntries(contentByType.map((r) => [r.type.toLowerCase(), r._count._all]));

    return {
      users: { total: totalUsers, newThisWeek: newUsers },
      content: { published: sm.published ?? 0, draft: sm.draft ?? 0, processing: sm.processing ?? 0 },
      subscriptions: { active: activeSubs },
      watchMinutes: Math.floor((watchSecs._sum.progressSeconds ?? 0) / 60),
      contentByType: tm,
    };
  } catch {
    return null;
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      label: "Total Users",
      value: stats?.users.total ?? "—",
      sub: stats ? `+${stats.users.newThisWeek} this week` : "",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Published Content",
      value: stats?.content.published ?? "—",
      sub: stats ? `${stats.content.processing} processing, ${stats.content.draft} drafts` : "",
      icon: Film,
      color: "text-kairo-gold",
      bg: "bg-kairo-gold/10",
    },
    {
      label: "Active Subscriptions",
      value: stats?.subscriptions.active ?? "—",
      sub: "Paying users",
      icon: CreditCard,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Watch Minutes",
      value: stats
        ? stats.watchMinutes >= 60
          ? `${Math.floor(stats.watchMinutes / 60).toLocaleString()}h`
          : `${stats.watchMinutes}m`
        : "—",
      sub: "Total platform watch time",
      icon: Clock,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  const contentTypes = stats?.contentByType
    ? Object.entries(stats.contentByType).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Platform overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon size={17} className={card.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
            </p>
            <p className="text-sm text-white/60 mt-0.5">{card.label}</p>
            {card.sub && <p className="text-xs text-white/30 mt-1">{card.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content by type */}
        <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-kairo-gold" />
            <h2 className="text-sm font-semibold text-white">Content by Type</h2>
          </div>
          {contentTypes.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">No published content yet.</p>
          ) : (
            <div className="space-y-3">
              {contentTypes.map(([type, count]) => {
                const total = contentTypes.reduce((s, [, c]) => s + c, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/60 capitalize">{type}</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 bg-kairo-dark-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-kairo-gold rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Zap size={16} className="text-kairo-gold" />
            <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            {[
              { label: "Upload new video", href: "/admin/content/new", desc: "Add movie, series, teaching…" },
              { label: "Create live event", href: "/admin/live/new", desc: "Schedule a live stream" },
              { label: "View all content", href: "/admin/content", desc: "Manage published library" },
              { label: "View users", href: "/admin/users", desc: "Browse registered accounts" },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-kairo-dark-border hover:border-kairo-gold/30 hover:bg-kairo-gold/5 transition-all group"
              >
                <div>
                  <p className="text-sm text-white font-medium group-hover:text-kairo-gold transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-white/30">{action.desc}</p>
                </div>
                <span className="text-white/20 group-hover:text-kairo-gold transition-colors text-lg">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
