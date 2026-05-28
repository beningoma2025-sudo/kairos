import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminLiveTable } from "@/components/admin/AdminLiveTable";

export const metadata: Metadata = { title: "Live Events | Kairo Admin" };

export default function AdminLivePage() {
  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Live Events</h1>
          <p className="text-white/40 text-sm mt-1">Schedule and manage live streams</p>
        </div>
        <Link
          href="/admin/live/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors"
        >
          <Plus size={16} />
          New Live Event
        </Link>
      </div>
      <AdminLiveTable />
    </div>
  );
}
