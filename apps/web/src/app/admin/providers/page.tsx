import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Globe, CheckCircle, XCircle } from "lucide-react";
import { ProvidersTable } from "@/components/admin/ProvidersTable";

export const metadata: Metadata = { title: "Partenaires | Kairo Admin" };

const TYPE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  api: "API Partenaire",
  embed: "Embed",
  rss: "RSS",
};

export { TYPE_LABELS };

export default function AdminProvidersPage() {
  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Partenaires de Contenu</h1>
          <p className="text-white/40 text-sm mt-1">
            Bibliothèques et plateformes avec qui Kairo a signé des contrats
          </p>
        </div>
        <Link
          href="/admin/providers/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors"
        >
          <Plus size={16} />
          Ajouter un partenaire
        </Link>
      </div>

      <ProvidersTable />
    </div>
  );
}
