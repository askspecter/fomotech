import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep navy-black taken from the PEA logo backdrop.
        bg: "#080810",
        surface: "#0f0f19",
        "surface-2": "#16161f",
        "surface-3": "#20202c",
        border: "#242430",
        "border-soft": "#1a1a24",
        muted: "#8a90a6",
        "muted-2": "#565c72",
        // Single vivid-red accent from the logo mark.
        brand: {
          DEFAULT: "#f5232e",
          bright: "#ff5b64",
          dim: "#b3141d",
        },
        accent: "#ff4d4d",
        up: "#2fd08a",
        down: "#ff4d5d",
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        brand: "linear-gradient(135deg, #ff3b46 0%, #f5232e 52%, #b3141d 100%)",
        "brand-soft": "linear-gradient(160deg, rgba(245,35,46,0.16), rgba(245,35,46,0.02))",
        "card": "linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0))",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.045) inset, 0 12px 32px -16px rgba(0,0,0,0.8)",
        glow: "0 0 40px -8px rgba(245,35,46,0.55)",
        "glow-sm": "0 0 18px -4px rgba(245,35,46,0.6)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(245,35,46,0.45)" },
          "70%": { boxShadow: "0 0 0 8px rgba(245,35,46,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(245,35,46,0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
