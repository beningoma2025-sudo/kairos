import type { Metadata } from "next";
import { SearchInterface } from "@/components/search/SearchInterface";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Kairo's library of faith content.",
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <div className="min-h-screen bg-kairo-dark px-8 py-10 max-w-[1800px] mx-auto">
      <SearchInterface searchParamsPromise={searchParams} />
    </div>
  );
}
