import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a12",
        surface: "#13131f",
        "surface-2": "#1a1a2b",
        "surface-3": "#22223a",
        border: "#26263a",
        "border-soft": "#1f1f30",
        muted: "#8b90a8",
        "muted-2": "#5f6580",
        brand: {
          DEFAULT: "#7c6cff",
          bright: "#a99dff",
          dim: "#5a4de0",
        },
        accent: "#22d3ee",
        up: "#2fd08a",
        down: "#f6465d",
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        brand: "linear-gradient(120deg, #7c6cff 0%, #9d7bff 45%, #22d3ee 100%)",
        "brand-soft": "linear-gradient(160deg, rgba(124,108,255,0.14), rgba(34,211,238,0.05))",
        "card": "linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0))",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        glow: "0 0 40px -8px rgba(124,108,255,0.5)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
