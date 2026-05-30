"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Link2 } from "lucide-react";
import { ImportUrlModal } from "./ImportUrlModal";

export function ContentPageHeader() {
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Content Library</h1>
          <p className="text-white/40 text-sm mt-1">Manage all published and draft content</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-kairo-dark-border text-white/60 hover:text-white hover:border-kairo-gold/40 text-sm transition-colors"
          >
            <Link2 size={15} />
            Import URL
          </button>
          <Link
            href="/admin/content/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors"
          >
            <Plus size={16} />
            Upload Content
          </Link>
        </div>
      </div>

      <ImportUrlModal
        open={showImport}
        onClose={() => setShowImport(false)}
      />
    </>
  );
}
