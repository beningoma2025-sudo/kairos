"use client";

import { useState } from "react";
import { Plus, Lock, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KidsProfileData } from "@/hooks/useKidsStore";

const AGE_GROUP_LABEL = {
  "2-5": "Little Ones · Ages 2–5",
  "6-9": "Kids · Ages 6–9",
  "10-13": "Tweens · Ages 10–13",
};

const AGE_GROUPS = [
  { value: "AGE_2_5", label: "Ages 2–5", color: "#4ADE80" },
  { value: "AGE_6_9", label: "Ages 6–9", color: "#60A5FA" },
  { value: "AGE_10_13", label: "Ages 10–13", color: "#C084FC" },
] as const;

const PROFILE_COLORS = ["#4ADE80", "#60A5FA", "#C084FC", "#F97316", "#EC4899", "#FBBF24"];

interface Props {
  profiles: KidsProfileData[];
  onSelect: (profile: KidsProfileData) => void;
  onOpenParent: () => void;
  onProfileCreated: (profile: KidsProfileData) => void;
}

export function KidsProfileSelector({ profiles, onSelect, onOpenParent, onProfileCreated }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAgeGroup, setNewAgeGroup] = useState<"AGE_2_5" | "AGE_6_9" | "AGE_10_13">("AGE_2_5");
  const [selectedColor, setSelectedColor] = useState(PROFILE_COLORS[0] as string);
  const [newLimit, setNewLimit] = useState(60);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createProfile() {
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/kids/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          ageGroup: newAgeGroup,
          color: selectedColor,
          dailyLimitMinutes: newLimit,
        }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const profile = (await res.json()) as KidsProfileData;
      onProfileCreated(profile);
      setShowAddForm(false);
      setNewName("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{ background: "linear-gradient(135deg, #0A1628 0%, #0A0A0F 60%, #12082A 100%)" }}
    >
      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              top: `${(i * 37 + 11) % 100}%`,
              left: `${(i * 53 + 7) % 100}%`,
              animationDelay: `${i * 0.4}s`,
              transform: `scale(${i % 3 === 0 ? 1.5 : 0.8})`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wider uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Kairo Kids
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
            Who&apos;s watching?
          </h1>
        </div>

        {/* Profile grid */}
        {!showAddForm ? (
          <>
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => onSelect(profile)}
                  className="group flex flex-col items-center gap-3 transition-all duration-200 hover:scale-110"
                >
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-kairo-dark shadow-lg group-hover:ring-4 group-hover:ring-white/20 transition-all"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-white font-medium text-sm">{profile.name}</span>
                  <span className="text-white/40 text-[11px]">
                    {AGE_GROUP_LABEL[profile.ageGroup]}
                  </span>
                </button>
              ))}

              {/* Add profile card */}
              {profiles.length < 5 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="group flex flex-col items-center gap-3 transition-all duration-200 hover:scale-110"
                >
                  <div className="w-24 h-24 rounded-2xl flex items-center justify-center bg-kairo-dark-muted border-2 border-dashed border-kairo-dark-border group-hover:border-white/20 transition-all">
                    <Plus size={28} className="text-white/30 group-hover:text-white/60 transition-colors" />
                  </div>
                  <span className="text-white/40 font-medium text-sm group-hover:text-white/70 transition-colors">
                    Add Profile
                  </span>
                </button>
              )}
            </div>

            {/* Parent access */}
            <div className="flex justify-center">
              <button
                onClick={onOpenParent}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-kairo-dark-border text-white/40 hover:text-white hover:border-white/20 text-sm transition-all"
              >
                <Lock size={14} />
                Parent Access
                <ChevronRight size={14} />
              </button>
            </div>
          </>
        ) : (
          /* Add profile form */
          <div className="max-w-sm mx-auto bg-kairo-dark-card border border-kairo-dark-border rounded-2xl p-6 animate-slide-up">
            <h2 className="text-white font-semibold text-lg mb-6 text-center">Create Profile</h2>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-white/50 text-xs font-medium mb-2">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Noah, Emma..."
                maxLength={30}
                autoFocus
                className="w-full bg-kairo-dark-muted border border-kairo-dark-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-kairo-gold/40"
              />
            </div>

            {/* Age group */}
            <div className="mb-4">
              <label className="block text-white/50 text-xs font-medium mb-2">Age Group</label>
              <div className="grid grid-cols-3 gap-2">
                {AGE_GROUPS.map((ag) => (
                  <button
                    key={ag.value}
                    onClick={() => {
                      setNewAgeGroup(ag.value);
                      setSelectedColor(ag.color);
                    }}
                    className={cn(
                      "py-2 rounded-xl text-xs font-medium border transition-all",
                      newAgeGroup === ag.value
                        ? "border-transparent text-kairo-dark font-bold"
                        : "border-kairo-dark-border text-white/50 hover:border-white/20"
                    )}
                    style={
                      newAgeGroup === ag.value ? { backgroundColor: ag.color } : undefined
                    }
                  >
                    {ag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="mb-4">
              <label className="block text-white/50 text-xs font-medium mb-2">Color</label>
              <div className="flex gap-2">
                {PROFILE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && (
                      <Check size={12} className="text-kairo-dark" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily limit */}
            <div className="mb-6">
              <label className="block text-white/50 text-xs font-medium mb-2">
                Daily Limit: <span className="text-white">{newLimit === 480 ? "No limit" : `${newLimit} min`}</span>
              </label>
              <div className="flex gap-2">
                {[30, 60, 120, 480].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setNewLimit(mins)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      newLimit === mins
                        ? "bg-kairo-gold border-kairo-gold text-kairo-dark"
                        : "border-kairo-dark-border text-white/40 hover:border-white/20"
                    )}
                  >
                    {mins === 480 ? "∞" : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-xs mb-4 text-center">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setError("");
                  setNewName("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-kairo-dark-border text-white/50 text-sm hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProfile}
                disabled={!newName.trim() || creating}
                className="flex-1 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
