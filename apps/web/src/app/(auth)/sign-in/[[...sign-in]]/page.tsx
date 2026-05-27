import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: "w-full max-w-md",
          card: "bg-kairo-dark-card border border-kairo-dark-border shadow-2xl rounded-2xl",
          headerTitle: "text-white font-display text-2xl",
          headerSubtitle: "text-white/50",
          socialButtonsBlockButton:
            "bg-kairo-dark-muted border border-kairo-dark-border text-white hover:border-kairo-gold/40 transition-all",
          socialButtonsBlockButtonText: "text-white font-medium",
          dividerLine: "bg-kairo-dark-border",
          dividerText: "text-white/30",
          formFieldLabel: "text-white/70 text-sm",
          formFieldInput:
            "bg-kairo-dark-muted border-kairo-dark-border text-white placeholder:text-white/20 focus:border-kairo-gold",
          formButtonPrimary:
            "bg-kairo-gold hover:bg-kairo-gold-light text-kairo-dark font-bold transition-all",
          footerActionLink: "text-kairo-gold hover:text-kairo-gold-light",
          identityPreviewText: "text-white",
          identityPreviewEditButtonIcon: "text-kairo-gold",
        },
        variables: {
          colorBackground: "#111118",
          colorText: "#ffffff",
          colorTextSecondary: "rgba(255,255,255,0.5)",
          colorInputBackground: "#2A2A3A",
          colorInputText: "#ffffff",
          borderRadius: "0.75rem",
        },
      }}
    />
  );
}
