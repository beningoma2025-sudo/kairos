"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Film, Globe, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "api", label: "API Partner" },
  { value: "embed", label: "Embed" },
  { value: "rss", label: "RSS Feed" },
] as const;

interface ProviderDetail {
  id: string;
  name: string;
  slug: string;
  type: string;
  logoUrl: string | null;
  website: string | null;
  description: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  embedToken: string | null;
  isActive: boolean;
  isVerified: boolean;
  _count: { content: number };
  content: { id: string; title: string; type: string; thumbnailUrl: string }[];
}

export default function EditProviderPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
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
  const [preview, setPreview] = useState<ProviderDetail | null>(null);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    fetch(`/api/admin/providers/${id}`)
      .then((r) => r.json())
      .then((data: ProviderDetail) => {
        setPreview(data);
        setForm({
          name: data.name,
          type: data.type,
          logoUrl: data.logoUrl ?? "",
          website: data.website ?? "",
          description: data.description ?? "",
          baseUrl: data.baseUrl ?? "",
          apiKey: data.apiKey ?? "",
          apiSecret: "",
          embedToken: data.embedToken ?? "",
          isActive: data.isActive,
          isVerified: data.isVerified,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erreur lors de la mise à jour");
        return;
      }
      router.push("/admin/providers");
    } catch {
      setError("Impossible de mettre à jour le partenaire.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce partenaire ? Le contenu associé sera dissocié.")) return;
    await fetch(`/api/admin/providers/${id}`, { method: "DELETE" });
    router.push("/admin/providers");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={20} className="animate-spin text-kairo-gold" />
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <Link
        href="/admin/providers"
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors w-fit"
      >
        <ArrowLeft size={15} /> Retour aux partenaires
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Modifier le partenaire</h1>
          {preview && (
            <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5">
              <Film size={12} /> {preview._count.content} contenus associés
            </p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/10 text-xs transition-colors"
        >
          <Trash2 size={13} /> Supprimer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("type", t.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-sm transition-all",
                  form.type === t.value
                    ? "border-kairo-gold bg-kairo-gold/10 text-white"
                    : "border-kairo-dark-border text-white/40 hover:text-white"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <Field label="Nom *">
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="input-kairo"
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
            className="input-kairo resize-none"
          />
        </Field>

        {/* API credentials */}
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
                  placeholder="(inchangé si vide)"
                  className="input-kairo font-mono"
                />
              </Field>
              <Field label="Nouveau secret">
                <input
                  value={form.apiSecret}
                  onChange={(e) => set("apiSecret", e.target.value)}
                  placeholder="(inchangé si vide)"
                  type="password"
                  className="input-kairo font-mono"
                />
              </Field>
            </div>
          </>
        )}

        {form.type === "embed" && (
          <Field label="Token embed">
            <input
              value={form.embedToken}
              onChange={(e) => set("embedToken", e.target.value)}
              className="input-kairo font-mono"
            />
          </Field>
        )}

        {/* Toggles */}
        <div className="flex gap-6 pt-2">
          <Toggle label="Actif" value={form.isActive} onChange={(v) => set("isActive", v)} />
          <Toggle label="Contrat signé" value={form.isVerified} onChange={(v) => set("isVerified", v)} />
        </div>

        {/* Recent content preview */}
        {preview && preview.content.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
              Derniers contenus publiés
            </p>
            <div className="grid grid-cols-5 gap-2">
              {preview.content.map((c) => (
                <div key={c.id} className="rounded-lg overflow-hidden bg-kairo-dark-card aspect-video">
                  {c.thumbnailUrl ? (
                    <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film size={14} className="text-white/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
            Enregistrer
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
        {label}
      </label>
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
