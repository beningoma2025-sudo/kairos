import type { Metadata } from "next";
import { Eye, CheckCircle, Clock, Archive } from "lucide-react";
import { AdminContentTable } from "@/components/admin/AdminContentTable";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";

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
      <ContentPageHeader />
      <AdminContentTable />
    </div>
  );
}
