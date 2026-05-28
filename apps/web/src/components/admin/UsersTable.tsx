"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  subscription: { plan: string; status: string } | null;
  isMe: boolean;
}

const ROLES = [
  { value: "VIEWER",      label: "Viewer",       color: "text-white/40",  desc: "Utilisateur standard" },
  { value: "CREATOR",     label: "Creator",      color: "text-green-400", desc: "Peut uploader du contenu" },
  { value: "CHURCH_ADMIN",label: "Church Admin", color: "text-kairo-gold",desc: "Gère sa chaîne" },
  { value: "SUPER_ADMIN", label: "Super Admin",  color: "text-red-400",   desc: "Accès total au panel" },
];

const PLAN_STYLE: Record<string, string> = {
  FREE:       "text-white/30 bg-white/5",
  INDIVIDUAL: "text-blue-400 bg-blue-500/10",
  FAMILY:     "text-purple-400 bg-purple-500/10",
  CHURCH:     "text-kairo-gold bg-kairo-gold/10",
  CREATOR:    "text-green-400 bg-green-500/10",
};

function RoleSelector({ user, isSuperAdmin }: { user: User; isSuperAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const roleInfo = ROLES.find((r) => r.value === currentRole);

  async function changeRole(newRole: string) {
    if (newRole === currentRole || saving) return;
    setOpen(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const msg = await res.text();
        alert(msg);
        return;
      }
      setCurrentRole(newRole);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  }

  // Can't change your own role or change roles if not SUPER_ADMIN
  if (!isSuperAdmin || user.isMe) {
    return (
      <span className={`text-xs font-medium ${roleInfo?.color ?? "text-white/40"}`}>
        {roleInfo?.label ?? currentRole}
        {user.isMe && <span className="text-white/20 ml-1">(vous)</span>}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
          open
            ? "border-kairo-gold/40 bg-kairo-gold/5"
            : "border-kairo-dark-border hover:border-white/20",
          roleInfo?.color,
          saving && "opacity-50 cursor-not-allowed"
        )}
      >
        {saving ? "..." : saved ? <><Check size={11} className="text-green-400" /> Sauvé</> : roleInfo?.label}
        {!saving && !saved && <ChevronDown size={11} className={cn("transition-transform", open && "rotate-180")} />}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-52 bg-kairo-dark-card border border-kairo-dark-border rounded-xl shadow-2xl overflow-hidden animate-slide-up">
          {ROLES.map((role) => (
            <button
              key={role.value}
              onClick={() => changeRole(role.value)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-kairo-dark-muted",
                currentRole === role.value && "bg-kairo-dark-muted"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className={cn("text-xs font-semibold", role.color)}>{role.label}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{role.desc}</div>
              </div>
              {currentRole === role.value && <Check size={13} className="text-kairo-gold shrink-0 mt-0.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function UsersTable({ users, isSuperAdmin }: { users: User[]; isSuperAdmin: boolean }) {
  return (
    <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl overflow-hidden">
      {users.length === 0 ? (
        <p className="text-center text-white/30 text-sm py-16">
          Aucun utilisateur. Sois le premier à t&apos;inscrire sur{" "}
          <a href="/sign-up" className="text-kairo-gold hover:underline">/sign-up</a>
        </p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-kairo-dark-border">
              {["Utilisateur", "Rôle", "Plan", "Statut", "Inscrit le"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] text-white/30 font-semibold uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-kairo-dark-border/50 hover:bg-kairo-dark-muted/30 transition-colors">
                {/* Avatar + name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-kairo-dark-muted flex items-center justify-center text-white/30 text-xs font-bold shrink-0">
                        {user.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{user.name}</p>
                      <p className="text-xs text-white/30 truncate">{user.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role selector */}
                <td className="px-4 py-3">
                  <RoleSelector user={user} isSuperAdmin={isSuperAdmin} />
                </td>

                {/* Plan */}
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-[11px] px-2 py-1 rounded-lg font-medium",
                    PLAN_STYLE[user.subscription?.plan ?? "FREE"] ?? PLAN_STYLE.FREE
                  )}>
                    {user.subscription?.plan ?? "FREE"}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-xs",
                    user.subscription?.status === "ACTIVE" ? "text-green-400" : "text-white/30"
                  )}>
                    {user.subscription?.status ?? "—"}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-xs text-white/30">
                  {formatRelativeDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
