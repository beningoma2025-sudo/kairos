import type { Config } from "tailwindcss";
import { kairoPreset } from "@kairo/config/tailwind";

const config: Config = {
  presets: [{ theme: kairoPreset.theme }],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
