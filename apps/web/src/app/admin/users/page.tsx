import type { Metadata } from "next";
import { prisma } from "@kairo/database";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Users | Kairo Admin" };

const PLAN_COLORS: Record<string, string> = {
  FREE: "text-white/30 bg-white/5",
  INDIVIDUAL: "text-blue-400 bg-blue-500/10",
  FAMILY: "text-purple-400 bg-purple-500/10",
  CHURCH: "text-kairo-gold bg-kairo-gold/10",
  CREATOR: "text-green-400 bg-green-500/10",
};

const ROLE_COLORS: Record<string, string> = {
  VIEWER: "text-white/30",
  CREATOR: "text-green-400",
  CHURCH_ADMIN: "text-kairo-gold",
  SUPER_ADMIN: "text-red-400",
};

export default async function AdminUsersPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const me = await prisma.user.findUnique({
    where: { clerkId },
    select: { role: true },
  });
  if (!me || !["SUPER_ADMIN", "CHURCH_ADMIN"].includes(me.role)) redirect("/browse");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true } },
    },
  });

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white">Users</h1>
        <p className="text-white/40 text-sm mt-1">{users.length} registered accounts</p>
      </div>

      <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-kairo-dark-border">
              {["User", "Role", "Plan", "Status", "Joined"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] text-white/30 font-semibold uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-kairo-dark-border/50 hover:bg-kairo-dark-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-kairo-dark-muted flex items-center justify-center text-white/30 text-xs font-bold">
                        {user.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-white font-medium">{user.name}</p>
                      <p className="text-xs text-white/30">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${ROLE_COLORS[user.role] ?? "text-white/40"}`}>
                    {user.role.toLowerCase().replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-1 rounded-lg font-medium ${PLAN_COLORS[user.subscription?.plan ?? "FREE"] ?? PLAN_COLORS.FREE}`}>
                    {user.subscription?.plan ?? "FREE"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${user.subscription?.status === "ACTIVE" ? "text-green-400" : "text-white/30"}`}>
                    {user.subscription?.status ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-white/30">
                  {formatRelativeDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
