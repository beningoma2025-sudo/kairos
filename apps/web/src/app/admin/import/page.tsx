"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, CheckCircle, Loader2, ChevronLeft, ChevronRight, Film, RefreshCw, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "biblical_films",   label: "Films Bibliques",       emoji: "✝️",  est: "2 000+" },
  { key: "christian_movies", label: "Films Chrétiens",       emoji: "🎬",  est: "3 000+" },
  { key: "billy_graham",     label: "Billy Graham",          emoji: "🎤",  est: "500+"   },
  { key: "sermons",          label: "Sermons",               emoji: "📖",  est: "5 000+" },
  { key: "gospel_music",     label: "Musique Gospel",        emoji: "🎵",  est: "1 000+" },
  { key: "missionaries",     label: "Missionnaires",         emoji: "🌍",  est: "800+"   },
  { key: "kids_faith",       label: "Enfants & Foi",         emoji: "👶",  est: "600+"   },
  { key: "documentaries",    label: "Documentaires",         emoji: "🎞️",  est: "1 500+" },
] as const;

interface ArchiveItem {
  identifier: string;
  title: string;
  description: string;
  year: string | number | null;
  thumbnailUrl: string;
  embedUrl: string;
  sourceUrl: string;
  alreadyImported: boolean;
}

interface ImportAllResult {
  imported: number;
  skipped: number;
  errors: number;
  total: number;
}

export default function ImportPage() {
  const [category, setCategory] = useState<string>("biblical_films");
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importAllProgress, setImportAllProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [maxItems, setMaxItems] = useState(1000);

  const isKids = category === "kids_faith";
  const catLabel = CATEGORIES.find((c) => c.key === category)?.label ?? category;
  const catEst = CATEGORIES.find((c) => c.key === category)?.est ?? "";

  const load = useCallback(async (cat: string, p: number) => {
    setLoading(true);
    setSelected(new Set());
    setResult(null);
    try {
      const res = await fetch(`/api/admin/import/archive?category=${cat}&page=${p}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items);
      setTotalPages(data.pages);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(category, page); }, [category, page, load]);

  function changeCategory(cat: string) {
    setCategory(cat);
    setPage(1);
  }

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(items.filter((i) => !i.alreadyImported).map((i) => i.identifier)));
  }

  async function handleImportSelected() {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const toImport = items.filter((i) => selected.has(i.identifier));
      const res = await fetch("/api/admin/import/archive/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toImport, isKids, category }),
      });
      const data = await res.json();
      setResult(data);
      setSelected(new Set());
      void load(category, page);
    } finally {
      setImporting(false);
    }
  }

  async function handleImportAll() {
    setImporting(true);
    setImportAllProgress(`Démarrage de l'import de ${catLabel}…`);
    setResult(null);
    try {
      const res = await fetch("/api/admin/import/archive/import-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, maxItems }),
      });
      const data: ImportAllResult = await res.json();
      setResult({ imported: data.imported, skipped: data.skipped });
      setImportAllProgress(null);
      void load(category, page);
    } catch {
      setImportAllProgress(null);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Import — Internet Archive</h1>
          <p className="text-white/40 text-sm mt-1">Films chrétiens domaine public • 100% gratuits</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button key={cat.key} onClick={() => changeCategory(cat.key)}
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
              category === cat.key
                ? "border-kairo-gold bg-kairo-gold/10"
                : "border-kairo-dark-border bg-kairo-dark-card hover:border-white/20"
            )}>
            <span className="text-xl">{cat.emoji}</span>
            <div>
              <p className={cn("text-sm font-medium", category === cat.key ? "text-white" : "text-white/60")}>{cat.label}</p>
              <p className="text-[11px] text-white/30">{cat.est} titres dispo</p>
            </div>
          </button>
        ))}
      </div>

      {/* Import All Panel */}
      <div className="bg-kairo-dark-card border border-kairo-gold/20 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-kairo-gold" />
              <h2 className="text-sm font-semibold text-white">Import en masse — {catLabel}</h2>
            </div>
            <p className="text-white/40 text-xs">
              Importe automatiquement toutes les pages de résultats. Estimation : <span className="text-kairo-gold">{catEst}</span> titres disponibles.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/40">Max</label>
              <select value={maxItems} onChange={(e) => setMaxItems(Number(e.target.value))}
                className="bg-kairo-dark-card border border-kairo-dark-border rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-kairo-gold">
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1 000</option>
                <option value={2000}>2 000</option>
                <option value={5000}>5 000</option>
              </select>
            </div>
            <button onClick={handleImportAll} disabled={importing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-bold text-sm hover:bg-kairo-gold-light transition-colors disabled:opacity-50">
              {importing && importAllProgress
                ? <Loader2 size={15} className="animate-spin" />
                : <Zap size={15} />}
              Tout importer ({maxItems.toLocaleString()})
            </button>
          </div>
        </div>

        {importAllProgress && (
          <div className="mt-3 flex items-center gap-2 text-sm text-kairo-gold">
            <Loader2 size={14} className="animate-spin" />
            {importAllProgress}
            <span className="text-white/30 text-xs ml-1">Cela peut prendre quelques minutes…</span>
          </div>
        )}
      </div>

      {/* Result banner */}
      {result && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-5">
          <CheckCircle size={16} />
          <span>
            <strong>{result.imported}</strong> vidéos importées
            {result.skipped > 0 && `, ${result.skipped} déjà présentes`}
          </span>
        </div>
      )}

      {/* Manual selection toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-white/30 text-sm">{total.toLocaleString()} résultats Archive.org</span>
          {items.some((i) => !i.alreadyImported) && (
            <button onClick={selectAll} className="text-xs text-kairo-gold hover:underline">Tout sélectionner la page</button>
          )}
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-xs text-white/30 hover:text-white/60">Désélectionner</button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={handleImportSelected} disabled={importing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-50">
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Importer sélection ({selected.size})
            </button>
          )}
          <button onClick={() => load(category, page)} className="p-2 rounded-lg text-white/30 hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-lg bg-kairo-dark-card animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-white/25">
          <Film size={28} className="mb-3 opacity-30" />
          <p className="text-sm">Aucun résultat</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {items.map((item) => {
            const sel = selected.has(item.identifier);
            return (
              <button key={item.identifier} onClick={() => !item.alreadyImported && toggleItem(item.identifier)}
                disabled={item.alreadyImported}
                className={cn(
                  "relative group rounded-lg overflow-hidden border transition-all text-left",
                  item.alreadyImported ? "opacity-40 cursor-default border-kairo-dark-border"
                    : sel ? "border-kairo-gold ring-1 ring-kairo-gold/50"
                    : "border-kairo-dark-border hover:border-kairo-gold/40 cursor-pointer"
                )}>
                <div className="aspect-video bg-kairo-dark-card relative">
                  <img src={item.thumbnailUrl} alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  {!item.alreadyImported && (
                    <div className={cn(
                      "absolute inset-0 flex items-center justify-center transition-opacity",
                      sel ? "opacity-100 bg-kairo-gold/25" : "opacity-0 group-hover:opacity-100 bg-black/50"
                    )}>
                      {sel ? <CheckCircle size={20} className="text-kairo-gold" /> : <Download size={16} className="text-white" />}
                    </div>
                  )}
                  {item.alreadyImported && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle size={12} className="text-green-400" />
                    </div>
                  )}
                  {item.year && (
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white/60 px-1 py-0.5 rounded">
                      {item.year}
                    </span>
                  )}
                </div>
                <div className="p-1.5">
                  <p className="text-[10px] text-white/60 font-medium line-clamp-1 leading-tight">{item.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}
            className="p-2 rounded-lg border border-kairo-dark-border text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-white/40">Page {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}
            className="p-2 rounded-lg border border-kairo-dark-border text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Warning about long import */}
      {importing && importAllProgress && (
        <div className="fixed bottom-6 right-6 bg-kairo-dark-card border border-kairo-gold/30 rounded-2xl p-4 shadow-2xl max-w-sm z-50">
          <div className="flex items-start gap-3">
            <Loader2 size={18} className="animate-spin text-kairo-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Import en cours…</p>
              <p className="text-xs text-white/50 mt-0.5">Ne ferme pas cette fenêtre. L'import peut prendre 2–5 minutes pour 1 000 vidéos.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
