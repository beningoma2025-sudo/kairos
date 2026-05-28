"use client";

import { useState, useEffect } from "react";
import { X, Delete, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "pin" | "controls";

interface ParentalSettings {
  hasPin: boolean;
  enabled: boolean;
  maxAgeRating: string;
  kidsMode: boolean;
  watchTimeLimit: number | null;
}

interface Props {
  onClose: () => void;
}

const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

const AGE_RATINGS = [
  { value: "TV_Y", label: "TV-Y", desc: "All children" },
  { value: "TV_Y7", label: "TV-Y7", desc: "Ages 7+" },
  { value: "TV_G", label: "TV-G", desc: "General audience" },
  { value: "TV_PG", label: "TV-PG", desc: "Parental guidance" },
];

const TIME_LIMITS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: null, label: "No limit" },
];

export function ParentPinModal({ onClose }: Props) {
  const [step, setStep] = useState<Step>("pin");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [settings, setSettings] = useState<ParentalSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local edit state for controls
  const [editRating, setEditRating] = useState("TV_PG");
  const [editLimit, setEditLimit] = useState<number | null>(60);
  const [editKidsMode, setEditKidsMode] = useState(false);

  function pressKey(key: string) {
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      setError("");
      return;
    }
    if (key === "") return;
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) {
      verifyPin(next);
    }
  }

  async function verifyPin(enteredPin: string) {
    setError("");
    try {
      const res = await fetch("/api/kids/parental-controls/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: enteredPin }),
      });

      if (!res.ok) {
        triggerShake();
        setPin("");
        setError("Incorrect PIN. Try again.");
        return;
      }

      const { isSetup: setup } = (await res.json()) as { valid: boolean; isSetup: boolean };
      setIsSetup(setup);

      // Load current settings
      const settingsRes = await fetch("/api/kids/parental-controls");
      if (settingsRes.ok) {
        const data = (await settingsRes.json()) as ParentalSettings;
        setSettings(data);
        setEditRating(data.maxAgeRating ?? "TV_PG");
        setEditLimit(data.watchTimeLimit);
        setEditKidsMode(data.kidsMode ?? false);
      }

      setStep("controls");
    } catch {
      triggerShake();
      setPin("");
      setError("Connection error. Please try again.");
    }
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  async function saveSettings() {
    if (!pin) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/kids/parental-controls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          enabled: true,
          maxAgeRating: editRating,
          kidsMode: editKidsMode,
          watchTimeLimit: editLimit,
        }),
      });
      if (!res.ok) {
        setError("Failed to save. Please try again.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Connection error.");
    } finally {
      setSaving(false);
    }
  }

  // Keyboard support for PIN
  useEffect(() => {
    if (step !== "pin") return;
    function onKey(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") pressKey(e.key);
      if (e.key === "Backspace") pressKey("del");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl w-full max-w-sm animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-kairo-dark-border">
          <h2 className="text-white font-semibold">
            {step === "pin" ? "Parent Access" : "Parental Controls"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-kairo-dark-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {step === "pin" ? (
          <div className="px-6 py-6">
            <p className="text-white/50 text-sm text-center mb-6">
              {isSetup ? "Set a 4-digit PIN to protect parent settings" : "Enter your 4-digit PIN"}
            </p>

            {/* PIN dots */}
            <div
              className={cn(
                "flex justify-center gap-3 mb-6 transition-all",
                shake && "animate-[shake_0.4s_ease-in-out]"
              )}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all",
                    i < pin.length
                      ? "bg-kairo-gold border-kairo-gold"
                      : "border-kairo-dark-border bg-transparent"
                  )}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center mb-4">{error}</p>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2">
              {PIN_KEYS.map((key, i) => (
                <button
                  key={i}
                  onClick={() => key !== "" && pressKey(key)}
                  disabled={key === ""}
                  className={cn(
                    "h-12 rounded-xl font-semibold text-lg transition-all",
                    key === ""
                      ? "cursor-default"
                      : key === "del"
                      ? "bg-kairo-dark-muted text-white/50 hover:text-white hover:bg-kairo-dark-border active:scale-95"
                      : "bg-kairo-dark-muted text-white hover:bg-kairo-dark-border active:scale-95"
                  )}
                >
                  {key === "del" ? <Delete size={18} className="mx-auto" /> : key}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-5">
            {isSetup && (
              <div className="px-3 py-2 rounded-lg bg-kairo-gold/10 border border-kairo-gold/20">
                <p className="text-kairo-gold text-xs text-center">
                  PIN set. Save your settings to activate parental controls.
                </p>
              </div>
            )}

            {/* Age rating */}
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
                Max Age Rating
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AGE_RATINGS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setEditRating(r.value)}
                    className={cn(
                      "flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all",
                      editRating === r.value
                        ? "bg-kairo-gold/10 border-kairo-gold/40 text-white"
                        : "border-kairo-dark-border text-white/40 hover:border-white/20"
                    )}
                  >
                    <span className="font-bold text-sm">{r.label}</span>
                    <span className="text-[11px] opacity-60">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily time limit */}
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
                Daily Time Limit
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_LIMITS.map((t) => (
                  <button
                    key={String(t.value)}
                    onClick={() => setEditLimit(t.value)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-medium border transition-all",
                      editLimit === t.value
                        ? "bg-kairo-gold border-kairo-gold text-kairo-dark"
                        : "border-kairo-dark-border text-white/40 hover:border-white/20"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kids mode toggle */}
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-sm text-white font-medium">Kids Mode</p>
                <p className="text-xs text-white/40">
                  Locks device to Kairo Kids section only
                </p>
              </div>
              <button
                onClick={() => setEditKidsMode((v) => !v)}
                className={cn(
                  "w-11 h-6 rounded-full transition-all relative",
                  editKidsMode ? "bg-kairo-gold" : "bg-kairo-dark-muted border border-kairo-dark-border"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                    editKidsMode ? "left-[22px]" : "left-0.5"
                  )}
                />
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <button
              onClick={saveSettings}
              disabled={saving}
              className={cn(
                "w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                saved
                  ? "bg-green-500/20 border border-green-500/30 text-green-400"
                  : "bg-kairo-gold text-kairo-dark hover:bg-kairo-gold-light disabled:opacity-50"
              )}
            >
              {saved ? (
                <>
                  <Check size={15} />
                  Saved!
                </>
              ) : saving ? (
                "Saving…"
              ) : (
                <>
                  Save Settings
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
