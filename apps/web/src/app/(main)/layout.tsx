import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { SpiritualAssistant } from "@/components/ai/SpiritualAssistant";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-16 bg-[#0f0f1a]" />}>
        <Navbar />
      </Suspense>
      <main className="pt-16">{children}</main>
      <SpiritualAssistant />
    </div>
  );
}
