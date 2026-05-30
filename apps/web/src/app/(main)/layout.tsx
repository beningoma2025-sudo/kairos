import { Navbar } from "@/components/layout/Navbar";
import { SpiritualAssistant } from "@/components/ai/SpiritualAssistant";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kairo-dark">
      <Navbar />
      <main className="pt-16">{children}</main>
      <SpiritualAssistant />
    </div>
  );
}
