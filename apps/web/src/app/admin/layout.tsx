import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";
import {
  LayoutDashboard,
  Film,
  Radio,
  Users,
  LogOut,
  Globe,
  Download,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Content", href: "/admin/content", icon: Film },
  { label: "Import Archive", href: "/admin/import", icon: Download },
  { label: "Providers", href: "/admin/providers", icon: Globe },
  { label: "Live Events", href: "/admin/live", icon: Radio },
  { label: "Users", href: "/admin/users", icon: Users },
] as const;

async function AdminSidebar() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { role: true, name: true },
  });

  if (!user || !["SUPER_ADMIN", "CHURCH_ADMIN"].includes(user.role)) {
    redirect("/browse");
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-kairo-dark-card border-r border-kairo-dark-border flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-kairo-dark-border">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-lg font-display font-bold text-white">KAIRO</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-kairo-gold/20 text-kairo-gold font-bold tracking-wider">
            ADMIN
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-kairo-dark-muted transition-colors"
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-kairo-dark-border space-y-3">
        <Link
          href="/browse"
          className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <LogOut size={13} />
          Back to Kairo
        </Link>
        <div className="flex items-center gap-2.5">
          <UserButton
            afterSignOutUrl="/"
            appearance={{ elements: { avatarBox: "w-7 h-7" } }}
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{user.name}</p>
            <p className="text-[10px] text-kairo-gold capitalize">{user.role.toLowerCase().replace("_", " ")}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kairo-dark flex">
      <AdminSidebar />
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}
