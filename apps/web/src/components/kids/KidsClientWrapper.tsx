"use client";

import { useEffect, useState } from "react";
import { Users, ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKidsStore, type KidsProfileData } from "@/hooks/useKidsStore";
import { KidsProfileSelector } from "./KidsProfileSelector";
import { ParentPinModal } from "./ParentPinModal";
import { KidsBadges } from "./KidsBadges";
import { ScreenTimeBar } from "./ScreenTimeBar";

interface Props {
  children: React.ReactNode;
}

export function KidsClientWrapper({ children }: Props) {
  const { activeProfile, setActiveProfile, clearActiveProfile } = useKidsStore();
  const [profiles, setProfiles] = useState<KidsProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showParentModal, setShowParentModal] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  useEffect(() => {
    fetch("/api/kids/profiles")
      .then((r) => r.json())
      .then((data: KidsProfileData[]) => {
        setProfiles(data);
        // If active profile is stale (deleted), clear it
        if (activeProfile && !data.find((p) => p.id === activeProfile.id)) {
          clearActiveProfile();
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(profile: KidsProfileData) {
    setActiveProfile(profile);
    setShowProfileSelector(false);
  }

  function handleProfileCreated(profile: KidsProfileData) {
    setProfiles((prev) => [...prev, profile]);
    setActiveProfile(profile);
    setShowProfileSelector(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0A0A0F 100%)" }}>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-kairo-gold rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  // No active profile — show full-screen selector
  if (!activeProfile && !showProfileSelector) {
    return (
      <>
        <KidsProfileSelector
          profiles={profiles}
          onSelect={handleSelect}
          onOpenParent={() => setShowParentModal(true)}
          onProfileCreated={handleProfileCreated}
        />
        {showParentModal && <ParentPinModal onClose={() => setShowParentModal(false)} />}
      </>
    );
  }

  // Profile switching overlay
  if (showProfileSelector) {
    return (
      <>
        <KidsProfileSelector
          profiles={profiles}
          onSelect={handleSelect}
          onOpenParent={() => setShowParentModal(true)}
          onProfileCreated={handleProfileCreated}
        />
        {showParentModal && <ParentPinModal onClose={() => setShowParentModal(false)} />}
      </>
    );
  }

  // Active profile — show kids content with profile bar
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0A0A0F 100%)" }}>
      {/* Profile bar */}
      <div className="relative px-8 py-6 border-b border-kairo-dark-border/50">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between flex-wrap gap-4">
          {/* Active profile info */}
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-kairo-dark shadow-md shrink-0"
              style={{ backgroundColor: activeProfile!.color }}
            >
              {activeProfile!.name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none mb-1">
                Hi, {activeProfile!.name}! 👋
              </p>
              <div className="mt-2 w-48">
                <ScreenTimeBar
                  watchTimeMinutes={activeProfile!.watchTimeToday}
                  limitMinutes={activeProfile!.dailyLimitMinutes}
                  compact
                />
              </div>
            </div>
          </div>

          {/* Badges (compact) */}
          <div className="hidden md:block">
            <KidsBadges completedCount={activeProfile!.completedCount} compact />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfilePanel((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                showProfilePanel
                  ? "border-kairo-gold/40 text-kairo-gold bg-kairo-gold/5"
                  : "border-kairo-dark-border text-white/50 hover:border-white/20 hover:text-white"
              )}
            >
              <Users size={14} />
              <span className="hidden sm:inline">Profile</span>
              <ChevronDown
                size={13}
                className={cn("transition-transform", showProfilePanel && "rotate-180")}
              />
            </button>
            <button
              onClick={() => setShowParentModal(true)}
              className="px-3 py-2 rounded-xl border border-kairo-dark-border text-white/40 hover:text-white hover:border-white/20 text-sm transition-all"
            >
              Parent
            </button>
          </div>
        </div>

        {/* Expandable profile panel */}
        {showProfilePanel && (
          <div className="max-w-[1800px] mx-auto mt-5 animate-slide-up">
            <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-2xl p-5 grid md:grid-cols-2 gap-6">
              {/* Badges full */}
              <KidsBadges completedCount={activeProfile!.completedCount} />

              {/* Screen time full + switch profile */}
              <div className="space-y-4">
                <ScreenTimeBar
                  watchTimeMinutes={activeProfile!.watchTimeToday}
                  limitMinutes={activeProfile!.dailyLimitMinutes}
                />

                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">
                    Switch Profile
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProfile(p);
                          setShowProfilePanel(false);
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                          activeProfile!.id === p.id
                            ? "border-transparent text-kairo-dark font-semibold"
                            : "border-kairo-dark-border text-white/60 hover:border-white/20"
                        )}
                        style={
                          activeProfile!.id === p.id
                            ? { backgroundColor: p.color }
                            : undefined
                        }
                      >
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold"
                          style={
                            activeProfile!.id !== p.id
                              ? { backgroundColor: p.color, color: "#0A0A0F" }
                              : undefined
                          }
                        >
                          {p.name[0]?.toUpperCase()}
                        </span>
                        {p.name}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setShowProfilePanel(false);
                        setShowProfileSelector(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-kairo-dark-border text-white/30 hover:border-white/20 text-sm transition-all"
                    >
                      <LogOut size={13} />
                      Change / Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kids content (server-rendered children) */}
      {children}

      {showParentModal && <ParentPinModal onClose={() => setShowParentModal(false)} />}
    </div>
  );
}
