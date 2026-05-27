import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen kairo-gradient flex flex-col items-center justify-center px-4">
      <Link href="/" className="mb-10 flex items-center gap-1.5">
        <span className="text-3xl font-display font-bold text-white">KAIRO</span>
        <span className="text-kairo-gold text-sm">✦</span>
      </Link>
      {children}
      <p className="mt-8 text-white/30 text-xs">
        © 2025 Kairo. All rights reserved.
      </p>
    </div>
  );
}
