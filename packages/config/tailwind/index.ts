import type { Config } from "tailwindcss";

export const kairoPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        kairo: {
          gold: "#C9A84C",
          "gold-light": "#E8C97A",
          "gold-dark": "#A07830",
          dark: "#0A0A0F",
          "dark-card": "#111118",
          "dark-border": "#1E1E2A",
          "dark-muted": "#2A2A3A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      backgroundImage: {
        "kairo-gradient": "linear-gradient(135deg, #0A0A0F 0%, #1A0A2E 100%)",
        "gold-gradient": "linear-gradient(135deg, #C9A84C 0%, #E8C97A 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
};
