import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Eye, CheckCircle, Clock, Archive } from "lucide-react";
import { AdminContentTable } from "@/components/admin/AdminContentTable";

export const metadata: Metadata = { title: "Content | Kairo Admin" };

const STATUS_STYLES: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  PUBLISHED: { label: "Published", icon: CheckCircle, cls: "text-green-400 bg-green-500/10" },
  PROCESSING: { label: "Processing", icon: Clock, cls: "text-yellow-400 bg-yellow-500/10" },
  DRAFT: { label: "Draft", icon: Archive, cls: "text-white/40 bg-white/5" },
  ARCHIVED: { label: "Archived", icon: Archive, cls: "text-white/20 bg-white/5" },
};

export { STATUS_STYLES };

export default function AdminContentPage() {
  return (
    <div className="px-8 py-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Content Library</h1>
          <p className="text-white/40 text-sm mt-1">Manage all published and draft content</p>
        </div>
        <Link
          href="/admin/content/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors"
        >
          <Plus size={16} />
          Upload Content
        </Link>
      </div>

      <AdminContentTable />
    </div>
  );
}
