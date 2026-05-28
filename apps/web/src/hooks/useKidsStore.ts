"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface KidsProfileData {
  id: string;
  name: string;
  avatarUrl?: string | null;
  ageGroup: "2-5" | "6-9" | "10-13";
  color: string;
  watchTimeToday: number;
  dailyLimitMinutes: number;
  completedCount: number;
}

interface KidsStore {
  activeProfile: KidsProfileData | null;
  setActiveProfile: (profile: KidsProfileData) => void;
  clearActiveProfile: () => void;
  updateWatchTime: (minutes: number) => void;
}

export const useKidsStore = create<KidsStore>()(
  persist(
    (set) => ({
      activeProfile: null,
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      clearActiveProfile: () => set({ activeProfile: null }),
      updateWatchTime: (minutes) =>
        set((state) =>
          state.activeProfile
            ? {
                activeProfile: {
                  ...state.activeProfile,
                  watchTimeToday: state.activeProfile.watchTimeToday + minutes,
                },
              }
            : state
        ),
    }),
    { name: "kairo-kids-active-profile" }
  )
);
