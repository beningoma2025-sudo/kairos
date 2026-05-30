"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Loader2, Link2, X, Youtube, Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportResult {
  id: string;
  title: string;
  sourceType: string;
  status: string;
}

interface ImportUrlModalProps {
  open: boolean;
  onClose: () => void;
  onImported?: (result: ImportResult) => void;
}

export function ImportUrlModal({ open, onClose, onImported }: ImportUrlModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [isKids, setIsKids] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (open) {
      setUrl("");
      setError("");
      setDone(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  async function handleImport() {
    if (!url.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), isKids, publishNow: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'import");
        return;
      }
      setDone(data as ImportResult);
      onImported?.(data as ImportResult);
    } catch {
      setError("Impossible d'importer ce contenu.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative bg-kairo-dark-card border border-kairo-dark-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-kairo-dark-border">
          <div className="flex items-center gap-2.5">
            <Link2 size={16} className="text-kairo-gold" />
            <h2 className="text-base font-semibold text-white">Importer depuis une URL</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-kairo-dark-muted transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={22} className="text-green-400" />
              </div>
              <p className="text-white font-semibold mb-1">{done.title}</p>
              <p className="text-white/40 text-sm mb-1">
                {done.sourceType} · {done.status}
              </p>
              <p className="text-white/25 text-xs">Contenu publié dans la bibliothèque</p>
              <div className="flex gap-3 justify-center mt-5">
                <button
                  onClick={() => { setDone(null); setUrl(""); }}
                  className="px-4 py-2 rounded-xl border border-kairo-dark-border text-white/50 hover:text-white text-sm transition-colors"
                >
                  Importer un autre
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Supported sources chips */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { icon: <Youtube size={12} />, label: "YouTube" },
                  { icon: <Film size={12} />, label: "Vimeo" },
                  { icon: <Link2 size={12} />, label: "Embed URL" },
                ].map((s) => (
                  <span
                    key={s.label}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-white/40 text-xs"
                  >
                    {s.icon} {s.label}
                  </span>
                ))}
              </div>

              {/* URL input */}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                  URL du contenu *
                </label>
                <input
                  ref={inputRef}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleImport()}
                  placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                  className="input-kairo"
                />
                <p className="text-[11px] text-white/25 mt-1.5">
                  Le titre, la description et la miniature seront récupérés automatiquement.
                </p>
              </div>

              {/* Kids toggle */}
              <button
                type="button"
                onClick={() => setIsKids((v) => !v)}
                className="flex items-center gap-2.5 text-sm text-white/60 hover:text-white transition-colors"
              >
                <div className={cn("w-9 h-5 rounded-full transition-colors relative", isKids ? "bg-kairo-gold" : "bg-white/10")}>
                  <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", isKids ? "translate-x-4" : "translate-x-0.5")} />
                </div>
                Contenu Kairo Kids
              </button>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleImport}
                  disabled={loading || !url.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
                  Importer
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-kairo-dark-border text-white/50 hover:text-white text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
