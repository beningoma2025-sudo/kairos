import { prisma } from "@kairo/database";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

  const [
    totalUsers,
    newUsersThisWeek,
    contentByStatus,
    activeSubscriptions,
    totalWatchSeconds,
    contentByType,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.content.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.subscription.count({
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
    }),
    prisma.watchHistory.aggregate({ _sum: { progressSeconds: true } }),
    prisma.content.groupBy({
      by: ["type"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
    }),
  ]);

  const statusMap = Object.fromEntries(
    contentByStatus.map((r) => [r.status.toLowerCase(), r._count._all])
  );

  const typeMap = Object.fromEntries(
    contentByType.map((r) => [r.type.toLowerCase(), r._count._all])
  );

  return Response.json({
    users: { total: totalUsers, newThisWeek: newUsersThisWeek },
    content: {
      published: statusMap.published ?? 0,
      draft: statusMap.draft ?? 0,
      processing: statusMap.processing ?? 0,
    },
    subscriptions: { active: activeSubscriptions },
    watchMinutes: Math.floor((totalWatchSeconds._sum.progressSeconds ?? 0) / 60),
    contentByType: typeMap,
  });
}
