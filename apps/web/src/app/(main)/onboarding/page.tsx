import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = { title: "Welcome to Kairo" };

export default function OnboardingPage() {
  return (
    <div className="min-h-screen kairo-gradient flex items-center justify-center px-4 py-16">
      <OnboardingFlow />
    </div>
  );
}
