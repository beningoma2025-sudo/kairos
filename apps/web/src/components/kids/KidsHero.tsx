import { Star } from "lucide-react";

export function KidsHero() {
  return (
    <div
      className="relative px-8 py-16 text-center overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0A1628 0%, transparent 100%)" }}
    >
      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <Star
            key={i}
            size={i % 3 === 0 ? 16 : 10}
            className="absolute text-kairo-gold/20 fill-kairo-gold/10"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wider uppercase mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Kairo Kids
        </div>

        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Stories that{" "}
          <span className="text-kairo-gold">inspire</span>
        </h1>
        <p className="text-white/60 text-lg max-w-lg mx-auto">
          Safe, faith-filled entertainment your kids will love. Zero ads, always appropriate.
        </p>
      </div>
    </div>
  );
}
