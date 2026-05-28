"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle, Clock, Archive, Trash2, Globe, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  thumbnailUrl: string;
  viewCount: number;
  isFeatured: boolean;
  isKids: boolean;
  muxPlaybackId: string | null;
  publishedAt: string | null;
  createdAt: string;
}

const STATUS_ICON: Record<string, { icon: React.ElementType; cls: string; label: string }> = {
  PUBLISHED: { icon: CheckCircle, cls: "text-green-400", label: "Published" },
  PROCESSING: { icon: Clock, cls: "text-yellow-400", label: "Processing" },
  DRAFT: { icon: Archive, cls: "text-white/30", label: "Draft" },
  ARCHIVED: { icon: Archive, cls: "text-white/20", label: "Archived" },
};

const FALLBACK_STATUS_ICON = { icon: Archive, cls: "text-white/30", label: "Draft" };

export function AdminContentTable() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/content?${params}`);
      if (!res.ok) return;
      const data = (await res.json()) as { data: ContentItem[]; pagination: { totalPages: number } };
      setItems(data.data);
      setTotalPages(data.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [page, statusFilter]);

  async function togglePublish(item: ContentItem) {
    setActionLoading(item.id);
    const newStatus = item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await fetch(`/api/admin/content/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await load();
    setActionLoading(null);
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this content permanently?")) return;
    setActionLoading(id);
    await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setActionLoading(null);
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {["", "PUBLISHED", "PROCESSING", "DRAFT", "ARCHIVED"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              statusFilter === s
                ? "bg-kairo-gold border-kairo-gold text-kairo-dark"
                : "border-kairo-dark-border text-white/40 hover:border-white/20"
            )}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center gap-1.5 py-16">
            <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">
            No content yet.{" "}
            <a href="/admin/content/new" className="text-kairo-gold hover:underline">
              Upload your first video →
            </a>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-kairo-dark-border">
                {["Content", "Type", "Status", "Views", "Added", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] text-white/30 font-semibold uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const statusInfo = STATUS_ICON[item.status] ?? FALLBACK_STATUS_ICON;
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={item.id} className="border-b border-kairo-dark-border/50 hover:bg-kairo-dark-muted/30 transition-colors">
                    {/* Content */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 rounded-lg overflow-hidden bg-kairo-dark-muted shrink-0 relative">
                          {item.thumbnailUrl && item.thumbnailUrl !== "https://image.mux.com/placeholder.png" ? (
                            <Image src={item.thumbnailUrl} alt="" fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">No img</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate max-w-[200px]">{item.title}</p>
                          <div className="flex gap-1.5 mt-0.5">
                            {item.isKids && <span className="text-[9px] px-1.5 rounded bg-blue-500/20 text-blue-400">Kids</span>}
                            {item.isFeatured && <span className="text-[9px] px-1.5 rounded bg-kairo-gold/20 text-kairo-gold">Featured</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3 text-xs text-white/50 capitalize">
                      {item.type.toLowerCase()}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className={cn("flex items-center gap-1.5 text-xs", statusInfo.cls)}>
                        <StatusIcon size={12} />
                        {statusInfo.label}
                      </div>
                    </td>
                    {/* Views */}
                    <td className="px-4 py-3 text-sm text-white/50">
                      {item.viewCount.toLocaleString()}
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-white/30">
                      {formatRelativeDate(item.createdAt)}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePublish(item)}
                          disabled={actionLoading === item.id || item.status === "PROCESSING"}
                          title={item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            item.status === "PUBLISHED"
                              ? "text-green-400 hover:bg-green-500/10"
                              : "text-white/30 hover:text-white hover:bg-kairo-dark-muted",
                            "disabled:opacity-30 disabled:cursor-not-allowed"
                          )}
                        >
                          {item.status === "PUBLISHED" ? <EyeOff size={14} /> : <Globe size={14} />}
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={actionLoading === item.id}
                          title="Delete"
                          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-kairo-dark-border text-white/50 text-sm hover:border-white/20 disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-white/40 text-sm">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-kairo-dark-border text-white/50 text-sm hover:border-white/20 disabled:opacity-30 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
