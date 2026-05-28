import type { Metadata } from "next";
import { prisma } from "@kairo/database";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UsersTable } from "@/components/admin/UsersTable";

export const metadata: Metadata = { title: "Users | Kairo Admin" };

export default async function AdminUsersPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const me = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  });
  if (!me || !["SUPER_ADMIN", "CHURCH_ADMIN"].includes(me.role)) redirect("/browse");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
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

  const isSuperAdmin = me.role === "SUPER_ADMIN";

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white">Gestion des utilisateurs</h1>
        <p className="text-white/40 text-sm mt-1">
          {users.length} compte{users.length !== 1 ? "s" : ""} enregistré{users.length !== 1 ? "s" : ""}
          {isSuperAdmin && " · Clique sur un rôle pour le modifier"}
        </p>
      </div>

      {/* Role legend */}
      {isSuperAdmin && (
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { role: "VIEWER",       color: "text-white/40",  desc: "Utilisateur standard" },
            { role: "CREATOR",      color: "text-green-400", desc: "Peut uploader du contenu" },
            { role: "CHURCH_ADMIN", color: "text-kairo-gold",desc: "Gère sa chaîne d'église" },
            { role: "SUPER_ADMIN",  color: "text-red-400",   desc: "Accès total au panel admin" },
          ].map((r) => (
            <div key={r.role} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-kairo-dark-card border border-kairo-dark-border">
              <span className={`text-xs font-semibold ${r.color}`}>{r.role}</span>
              <span className="text-[11px] text-white/30">— {r.desc}</span>
            </div>
          ))}
        </div>
      )}

      <UsersTable
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          subscription: u.subscription
            ? { plan: u.subscription.plan, status: u.subscription.status }
            : null,
          isMe: u.id === me.id,
        }))}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
