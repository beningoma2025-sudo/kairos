import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/browse");
  }

  return (
    <main className="min-h-screen kairo-gradient overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-display font-bold text-white">KAIRO</span>
          <span className="text-kairo-gold text-xs font-semibold tracking-widest uppercase ml-1">
            ✦
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            Sign In
          </Link>
          <Link href="/sign-up" className="btn-primary text-sm py-2 px-5">
            Start Watching
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-8 pt-24">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kairo-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-kairo-gold/30 bg-kairo-gold/10 text-kairo-gold text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-kairo-gold animate-pulse" />
              Now streaming faith content
            </div>

            <h1 className="text-5xl lg:text-7xl font-display font-bold text-white leading-tight mb-6">
              Faith.{" "}
              <span className="text-gold">Family.</span>
              {" "}Stories.
            </h1>

            <p className="text-xl text-white/70 leading-relaxed mb-10 max-w-lg">
              The modern streaming platform where faith-centered stories,
              children&apos;s content, and live spiritual experiences come
              together for families worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/sign-up" className="btn-primary text-center text-base py-4 px-8">
                Start Free Trial
              </Link>
              <Link href="/browse" className="btn-secondary text-center text-base py-4 px-8">
                Browse Content
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 text-sm text-white/50">
              <div>
                <div className="text-2xl font-bold text-white">10K+</div>
                <div>Hours of content</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-2xl font-bold text-white">30+</div>
                <div>Languages</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-2xl font-bold text-white">Live</div>
                <div>Daily worship</div>
              </div>
            </div>
          </div>

          {/* Content Preview Grid */}
          <div className="hidden lg:grid grid-cols-2 gap-3 animate-slide-up">
            {PREVIEW_CONTENT.map((item) => (
              <div
                key={item.title}
                className={`relative rounded-xl overflow-hidden ${item.tall ? "row-span-2" : ""}`}
                style={{ aspectRatio: item.tall ? "9/16" : "16/9" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-kairo-gold/20 to-purple-900/40" />
                <div className="absolute inset-0 flex items-end p-4">
                  <div>
                    <div className="text-xs text-kairo-gold font-semibold mb-1">{item.type}</div>
                    <div className="text-white font-semibold text-sm">{item.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-8 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-white/60">Start free, upgrade anytime</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 border transition-all duration-300 ${
                plan.featured
                  ? "border-kairo-gold bg-kairo-gold/5 shadow-xl shadow-kairo-gold/10"
                  : "border-kairo-dark-border bg-kairo-dark-card"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-kairo-gold text-kairo-dark text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-white/50">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-white/70 text-sm">
                    <span className="text-kairo-gold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={`block text-center py-3 rounded-lg font-semibold transition-all ${
                  plan.featured
                    ? "bg-kairo-gold text-kairo-dark hover:bg-kairo-gold-light"
                    : "border border-white/20 text-white hover:border-kairo-gold hover:text-kairo-gold"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-kairo-dark-border px-8 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-white/40 text-sm">
          <span className="font-display font-bold text-white/60">KAIRO</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
          </div>
          <span>© 2025 Kairo. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}

const PREVIEW_CONTENT = [
  { title: "The Garden", type: "MOVIE", tall: true },
  { title: "Morning Devotion", type: "LIVE", tall: false },
  { title: "Kids Bible Stories", type: "KIDS", tall: false },
];

const PLANS = [
  {
    name: "Individual",
    price: "7.99",
    featured: false,
    features: [
      "1 profile",
      "HD streaming",
      "VOD library",
      "Live events",
      "Watch on any device",
    ],
  },
  {
    name: "Family",
    price: "14.99",
    featured: true,
    features: [
      "6 profiles",
      "4K Ultra HD",
      "Kairo Kids included",
      "Offline downloads",
      "Parental controls",
      "4 simultaneous streams",
    ],
  },
  {
    name: "Church",
    price: "49.99",
    featured: false,
    features: [
      "Unlimited profiles",
      "Branded channel page",
      "Content upload dashboard",
      "Live streaming tools",
      "Audience analytics",
      "Custom branding",
    ],
  },
];
