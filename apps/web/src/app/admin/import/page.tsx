"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, CheckCircle, Loader2, ChevronLeft, ChevronRight, Film, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "biblical_films",   label: "Films Bibliques",       emoji: "✝️" },
  { key: "christian_movies", label: "Films Chrétiens",       emoji: "🎬" },
  { key: "billy_graham",     label: "Billy Graham",          emoji: "🎤" },
  { key: "sermons",          label: "Sermons",               emoji: "📖" },
  { key: "gospel_music",     label: "Musique Gospel",        emoji: "🎵" },
  { key: "missionaries",     label: "Missionnaires",         emoji: "🌍" },
  { key: "kids_faith",       label: "Enfants & Foi",         emoji: "👶" },
  { key: "documentaries",    label: "Documentaires",         emoji: "🎞️" },
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

export default function ImportPage() {
  const [category, setCategory] = useState<string>("biblical_films");
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const isKids = category === "kids_faith";

  const load = useCallback(async (cat: string, p: number) => {
    setLoading(true);
    setSelected(new Set());
    setImportResult(null);
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
    const importable = items.filter((i) => !i.alreadyImported).map((i) => i.identifier);
    setSelected(new Set(importable));
  }

  async function handleImport() {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const toImport = items.filter((i) => selected.has(i.identifier));
      const res = await fetch("/api/admin/import/archive/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toImport, isKids }),
      });
      const result = await res.json();
      setImportResult(result);
      setSelected(new Set());
      void load(category, page);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Import — Internet Archive</h1>
          <p className="text-white/40 text-sm mt-1">
            Des milliers de films chrétiens en domaine public, 100% gratuits
          </p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors disabled:opacity-50"
          >
            {importing
              ? <Loader2 size={15} className="animate-spin" />
              : <Download size={15} />}
            Importer {selected.size} contenu{selected.size > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-6">
          <CheckCircle size={16} />
          <span>
            <strong>{importResult.imported}</strong> contenus importés
            {importResult.skipped > 0 && `, ${importResult.skipped} déjà présents`}
          </span>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => changeCategory(cat.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
              category === cat.key
                ? "bg-kairo-gold/10 border-kairo-gold text-kairo-gold"
                : "bg-kairo-dark-card border-kairo-dark-border text-white/50 hover:text-white hover:border-white/20"
            )}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-white/30 text-sm">
            {total.toLocaleString()} résultats
          </span>
          {items.some((i) => !i.alreadyImported) && (
            <button
              onClick={selectAll}
              className="text-xs text-kairo-gold hover:underline"
            >
              Tout sélectionner
            </button>
          )}
          {selected.size > 0 && (
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-white/30 hover:text-white/60"
            >
              Désélectionner
            </button>
          )}
        </div>
        <button
          onClick={() => load(category, page)}
          className="p-1.5 rounded-lg text-white/30 hover:text-white transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-kairo-dark-card animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/25">
          <Film size={32} className="mb-3 opacity-30" />
          <p className="text-sm">Aucun résultat pour cette catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((item) => {
            const sel = selected.has(item.identifier);
            return (
              <button
                key={item.identifier}
                onClick={() => !item.alreadyImported && toggleItem(item.identifier)}
                disabled={item.alreadyImported}
                className={cn(
                  "relative group rounded-xl overflow-hidden border transition-all text-left",
                  item.alreadyImported
                    ? "opacity-40 cursor-default border-kairo-dark-border"
                    : sel
                    ? "border-kairo-gold ring-1 ring-kairo-gold/50"
                    : "border-kairo-dark-border hover:border-kairo-gold/40 cursor-pointer"
                )}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-kairo-dark-card relative">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' fill='%231a1a2e'%3E%3Crect width='320' height='180'/%3E%3C/svg%3E";
                    }}
                  />

                  {/* Overlay */}
                  {!item.alreadyImported && (
                    <div className={cn(
                      "absolute inset-0 flex items-center justify-center transition-opacity",
                      sel ? "opacity-100 bg-kairo-gold/20" : "opacity-0 group-hover:opacity-100 bg-black/50"
                    )}>
                      {sel
                        ? <CheckCircle size={22} className="text-kairo-gold" />
                        : <Download size={18} className="text-white" />}
                    </div>
                  )}

                  {item.alreadyImported && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-medium">
                        Importé
                      </span>
                    </div>
                  )}

                  {item.year && (
                    <div className="absolute bottom-1 left-1.5">
                      <span className="text-[10px] bg-black/60 text-white/60 px-1.5 py-0.5 rounded">
                        {item.year}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="p-2">
                  <p className="text-[11px] text-white/70 font-medium line-clamp-2 leading-tight">
                    {item.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-2 rounded-lg border border-kairo-dark-border text-white/40 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-white/40">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="p-2 rounded-lg border border-kairo-dark-border text-white/40 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
