import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";
import { Navbar } from "@/components/layout/Navbar";
import { SpiritualAssistant } from "@/components/ai/SpiritualAssistant";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { userId: clerkId } = await auth();

  let isAdmin = false;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true },
    });
    isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "CHURCH_ADMIN";
  }

  return (
    <div className="min-h-screen bg-kairo-dark">
      <Navbar isAdmin={isAdmin} />
      <main className="pt-16">{children}</main>
      <SpiritualAssistant />
    </div>
  );
}
