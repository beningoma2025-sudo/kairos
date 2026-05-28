import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ContentUploadForm } from "@/components/admin/ContentUploadForm";

export const metadata: Metadata = { title: "Upload Content | Kairo Admin" };

export default function NewContentPage() {
  return (
    <div className="px-8 py-8 max-w-[900px]">
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Content
      </Link>

      <h1 className="text-2xl font-display font-bold text-white mb-2">Upload New Content</h1>
      <p className="text-white/40 text-sm mb-8">
        Video uploads go directly to Mux CDN. Fill in metadata after the upload completes.
      </p>

      <ContentUploadForm />
    </div>
  );
}
