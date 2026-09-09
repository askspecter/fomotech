import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep navy taken from the PEA cover art.
        bg: "#080b16",
        surface: "#0f1322",
        "surface-2": "#161b2e",
        "surface-3": "#212841",
        border: "#262d44",
        "border-soft": "#1a2036",
        muted: "#9098b4",
        "muted-2": "#5f688a",
        // Periwinkle / steel-blue accent from the cover's rim light.
        brand: {
          DEFAULT: "#5b7cff",
          bright: "#9db0ff",
          dim: "#3f57cc",
        },
        accent: "#aeb9d6",
        up: "#3ecf8e",
        down: "#ff5d6c",
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        brand: "linear-gradient(135deg, #7d97ff 0%, #5b7cff 52%, #3f57cc 100%)",
        "brand-soft": "linear-gradient(160deg, rgba(91,124,255,0.16), rgba(91,124,255,0.02))",
        "card": "linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0))",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.045) inset, 0 12px 32px -16px rgba(0,0,0,0.8)",
        glow: "0 0 40px -8px rgba(91,124,255,0.55)",
        "glow-sm": "0 0 18px -4px rgba(91,124,255,0.6)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(91,124,255,0.45)" },
          "70%": { boxShadow: "0 0 0 8px rgba(91,124,255,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(91,124,255,0)" },
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
