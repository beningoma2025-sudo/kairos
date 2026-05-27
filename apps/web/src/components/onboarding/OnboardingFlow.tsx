"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { SUBSCRIPTION_PLANS } from "@kairo/types";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "plan" | "preferences" | "done";

const DENOMINATIONS = [
  "Baptist", "Catholic", "Charismatic", "Episcopal", "Lutheran",
  "Methodist", "Non-denominational", "Orthodox", "Pentecostal",
  "Presbyterian", "Reformed", "Other",
];

export function OnboardingFlow() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<"individual" | "family">("family");
  const [denomination, setDenomination] = useState("");
  const [maturity, setMaturity] = useState<"new_believer" | "growing" | "mature">("growing");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, denomination, spiritualMaturity: maturity }),
      });
      router.push("/browse");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-10 justify-center">
        {(["plan", "preferences"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                step === s || (i === 0 && step === "preferences") || step === "done"
                  ? "bg-kairo-gold text-kairo-dark"
                  : "bg-kairo-dark-muted text-white/30"
              )}
            >
              {(i === 0 && (step === "preferences" || step === "done")) ? (
                <Check size={14} />
              ) : (
                i + 1
              )}
            </div>
            {i < 1 && (
              <div
                className={cn(
                  "h-px w-16 transition-all",
                  step === "preferences" || step === "done"
                    ? "bg-kairo-gold"
                    : "bg-kairo-dark-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step: Plan Selection */}
      {step === "plan" && (
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-white text-center mb-2">
            Choose your plan
          </h1>
          <p className="text-white/50 text-center mb-8">
            Start with a 7-day free trial. Cancel anytime.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {(["individual", "family"] as const).map((plan) => {
              const p = SUBSCRIPTION_PLANS[plan];
              return (
                <button
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    "relative p-6 rounded-2xl border text-left transition-all",
                    selectedPlan === plan
                      ? "border-kairo-gold bg-kairo-gold/5 shadow-lg shadow-kairo-gold/10"
                      : "border-kairo-dark-border bg-kairo-dark-card hover:border-kairo-gold/30"
                  )}
                >
                  {plan === "family" && (
                    <span className="absolute -top-2.5 left-4 bg-kairo-gold text-kairo-dark text-xs font-bold px-3 py-0.5 rounded-full">
                      Best for families
                    </span>
                  )}
                  {selectedPlan === plan && (
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-kairo-gold flex items-center justify-center">
                      <Check size={11} className="text-kairo-dark" />
                    </div>
                  )}
                  <p className="text-white font-bold text-lg mb-1">{p.name}</p>
                  <p className="text-3xl font-bold text-white mb-3">
                    ${p.price}
                    <span className="text-sm font-normal text-white/40">/mo</span>
                  </p>
                  <ul className="space-y-1.5 text-sm text-white/60">
                    <li>✓ {p.profiles === 1 ? "1 profile" : `${p.profiles} profiles`}</li>
                    <li>✓ {p.resolution} streaming</li>
                    {p.includesKids && <li>✓ Kairo Kids included</li>}
                    <li>✓ All live events</li>
                  </ul>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep("preferences")}
            className="btn-primary w-full text-center py-4"
          >
            Continue with {SUBSCRIPTION_PLANS[selectedPlan].name} — Free Trial
          </button>

          <p className="text-white/30 text-xs text-center mt-4">
            No credit card required for trial. Cancel before 7 days and you won&apos;t be charged.
          </p>
        </div>
      )}

      {/* Step: Preferences */}
      {step === "preferences" && (
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-white text-center mb-2">
            Personalize your experience
          </h1>
          <p className="text-white/50 text-center mb-8">
            We&apos;ll tailor content recommendations just for you.
          </p>

          <div className="space-y-6 mb-8">
            {/* Denomination */}
            <div>
              <label className="text-white/70 text-sm font-medium block mb-3">
                Your denomination (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {DENOMINATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDenomination(denomination === d ? "" : d)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border transition-all",
                      denomination === d
                        ? "border-kairo-gold bg-kairo-gold/10 text-kairo-gold"
                        : "border-kairo-dark-border text-white/50 hover:border-white/30"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Spiritual Maturity */}
            <div>
              <label className="text-white/70 text-sm font-medium block mb-3">
                Where are you in your faith journey?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { value: "new_believer", label: "New Believer", desc: "Just getting started" },
                    { value: "growing", label: "Growing", desc: "Building my faith" },
                    { value: "mature", label: "Mature", desc: "Deeply rooted" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMaturity(opt.value)}
                    className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      maturity === opt.value
                        ? "border-kairo-gold bg-kairo-gold/5 text-white"
                        : "border-kairo-dark-border text-white/50 hover:border-kairo-gold/30"
                    )}
                  >
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("plan")}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {loading ? "Setting up your account…" : "Start Watching"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
