"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, CheckCircle, XCircle, Pencil, Trash2, Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  name: string;
  slug: string;
  type: string;
  logoUrl: string | null;
  website: string | null;
  isActive: boolean;
  isVerified: boolean;
  contentCount: number;
  createdAt: string;
}

const TYPE_BADGE: Record<string, string> = {
  youtube: "bg-red-500/10 text-red-400",
  vimeo: "bg-blue-500/10 text-blue-400",
  api: "bg-purple-500/10 text-purple-400",
  embed: "bg-green-500/10 text-green-400",
  rss: "bg-orange-500/10 text-orange-400",
};

const TYPE_LABEL: Record<string, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  api: "API",
  embed: "Embed",
  rss: "RSS",
};

export function ProvidersTable() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/providers");
    if (res.ok) setProviders(await res.json());
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function toggleActive(p: Provider) {
    await fetch(`/api/admin/providers/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    setProviders((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x))
    );
  }

  async function deleteProvider(id: string) {
    if (!confirm("Supprimer ce partenaire ? Le contenu associé sera dissocié.")) return;
    await fetch(`/api/admin/providers/${id}`, { method: "DELETE" });
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center gap-1.5 py-16">
        <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="bg-kairo-dark-card border border-dashed border-kairo-dark-border rounded-2xl py-20 text-center">
        <Globe size={36} className="text-white/10 mx-auto mb-4" />
        <p className="text-white/40 text-sm mb-2">Aucun partenaire encore.</p>
        <p className="text-white/20 text-xs mb-6">
          Ajoute les bibliothèques de contenu chrétien avec qui tu as signé un contrat.
        </p>
        <Link
          href="/admin/providers/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors"
        >
          Ajouter le premier partenaire
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-kairo-dark-border">
            {["Partenaire", "Type", "Contenu", "Statut", "Contrat", "Actions"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[11px] text-white/30 font-semibold uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => (
            <tr key={p.id} className="border-b border-kairo-dark-border/50 hover:bg-kairo-dark-muted/30 transition-colors">
              {/* Name */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {p.logoUrl ? (
                    <img src={p.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover bg-white/5" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-kairo-dark-muted flex items-center justify-center">
                      <Globe size={14} className="text-white/30" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    {p.website && (
                      <a href={p.website} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-white/30 hover:text-kairo-gold transition-colors truncate max-w-[160px] block">
                        {p.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>
              </td>

              {/* Type */}
              <td className="px-4 py-3">
                <span className={cn("text-[11px] px-2 py-1 rounded-lg font-medium", TYPE_BADGE[p.type] ?? "bg-white/5 text-white/40")}>
                  {TYPE_LABEL[p.type] ?? p.type}
                </span>
              </td>

              {/* Content count */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-white/50">
                  <Film size={13} />
                  <span className="text-sm">{p.contentCount}</span>
                </div>
              </td>

              {/* Active */}
              <td className="px-4 py-3">
                <button onClick={() => toggleActive(p)}
                  className={cn("flex items-center gap-1.5 text-xs font-medium transition-colors",
                    p.isActive ? "text-green-400 hover:text-red-400" : "text-white/30 hover:text-green-400")}>
                  {p.isActive ? <CheckCircle size={13} /> : <XCircle size={13} />}
                  {p.isActive ? "Actif" : "Inactif"}
                </button>
              </td>

              {/* Verified */}
              <td className="px-4 py-3">
                {p.isVerified ? (
                  <span className="flex items-center gap-1 text-[11px] text-kairo-gold">
                    <CheckCircle size={12} /> Signé
                  </span>
                ) : (
                  <span className="text-[11px] text-white/25">En négociation</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Link href={`/admin/providers/${p.id}`}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-kairo-dark-muted transition-colors"
                    title="Modifier">
                    <Pencil size={14} />
                  </Link>
                  <button onClick={() => deleteProvider(p.id)}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
