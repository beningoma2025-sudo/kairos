import { Navbar } from "@/components/layout/Navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kairo-dark">
      <Navbar />
      <main className="pt-16">{children}</main>
    </div>
  );
}
