"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "youtube", label: "YouTube", desc: "Import via YouTube oEmbed / Data API" },
  { value: "vimeo", label: "Vimeo", desc: "Import via Vimeo oEmbed API" },
  { value: "api", label: "API Partner", desc: "Direct HLS/MP4 stream from partner API" },
  { value: "embed", label: "Embed", desc: "HTML iframe embed code from partner" },
  { value: "rss", label: "RSS Feed", desc: "Content catalog via RSS/Atom feed" },
] as const;

export default function NewProviderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    type: "youtube",
    logoUrl: "",
    website: "",
    description: "",
    baseUrl: "",
    apiKey: "",
    apiSecret: "",
    embedToken: "",
    isActive: true,
    isVerified: false,
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue");
        return;
      }
      router.push("/admin/providers");
    } catch {
      setError("Impossible de créer le partenaire.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <Link
        href="/admin/providers"
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors w-fit"
      >
        <ArrowLeft size={15} /> Retour aux partenaires
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white">Nouveau partenaire</h1>
        <p className="text-white/40 text-sm mt-1">Ajouter une bibliothèque de contenu</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type selector */}
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            Type de partenaire
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("type", t.value)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  form.type === t.value
                    ? "border-kairo-gold bg-kairo-gold/10 text-white"
                    : "border-kairo-dark-border bg-kairo-dark-card text-white/40 hover:text-white hover:border-white/20"
                )}
              >
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-[11px] mt-0.5 opacity-60">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <Field label="Nom du partenaire *">
          <input
            required
            value={form.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!form.slug || form.slug === slugify(form.name)) {
                set("slug", slugify(e.target.value));
              }
            }}
            placeholder="ex: GodTV, Elevation Church"
            className="input-kairo"
          />
        </Field>

        {/* Slug */}
        <Field label="Slug *" hint="Identifiant URL unique (lettres minuscules, chiffres, tirets)">
          <input
            required
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="ex: god-tv"
            pattern="^[a-z0-9-]+$"
            className="input-kairo font-mono"
          />
        </Field>

        {/* Logo + Website */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="URL du logo">
            <input
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              placeholder="https://..."
              type="url"
              className="input-kairo"
            />
          </Field>
          <Field label="Site web">
            <input
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://..."
              type="url"
              className="input-kairo"
            />
          </Field>
        </div>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            placeholder="Courte description du partenaire…"
            className="input-kairo resize-none"
          />
        </Field>

        {/* API credentials (shown for api / rss types) */}
        {(form.type === "api" || form.type === "rss") && (
          <>
            <Field label="URL de base API">
              <input
                value={form.baseUrl}
                onChange={(e) => set("baseUrl", e.target.value)}
                placeholder="https://api.partner.com/v1"
                type="url"
                className="input-kairo"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Clé API">
                <input
                  value={form.apiKey}
                  onChange={(e) => set("apiKey", e.target.value)}
                  placeholder="sk_live_..."
                  className="input-kairo font-mono"
                />
              </Field>
              <Field label="Secret API">
                <input
                  value={form.apiSecret}
                  onChange={(e) => set("apiSecret", e.target.value)}
                  placeholder="secret..."
                  type="password"
                  className="input-kairo font-mono"
                />
              </Field>
            </div>
          </>
        )}

        {/* Embed token */}
        {form.type === "embed" && (
          <Field label="Token embed">
            <input
              value={form.embedToken}
              onChange={(e) => set("embedToken", e.target.value)}
              placeholder="Token d'authentification embed…"
              className="input-kairo font-mono"
            />
          </Field>
        )}

        {/* Status toggles */}
        <div className="flex gap-6 pt-2">
          <Toggle
            label="Actif"
            value={form.isActive}
            onChange={(v) => set("isActive", v)}
          />
          <Toggle
            label="Contrat signé"
            value={form.isVerified}
            onChange={(v) => set("isVerified", v)}
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
            Créer le partenaire
          </button>
          <Link
            href="/admin/providers"
            className="px-5 py-2.5 rounded-xl border border-kairo-dark-border text-white/50 hover:text-white text-sm transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {hint && <p className="text-[11px] text-white/30 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2.5 text-sm text-white/60 hover:text-white transition-colors"
    >
      <div className={cn("w-9 h-5 rounded-full transition-colors relative", value ? "bg-kairo-gold" : "bg-white/10")}>
        <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", value ? "translate-x-4" : "translate-x-0.5")} />
      </div>
      {label}
    </button>
  );
}
