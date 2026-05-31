import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { SpiritualAssistant } from "@/components/ai/SpiritualAssistant";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <Suspense fallback={<div className="h-16 bg-kairo-dark" />}>
        <Navbar />
      </Suspense>
      <main className="pt-16">{children}</main>
      <SpiritualAssistant />
    </div>
  );
}
