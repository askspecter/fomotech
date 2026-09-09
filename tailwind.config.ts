import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0b0f",
        surface: "#13151c",
        "surface-2": "#1b1e27",
        border: "#262a36",
        muted: "#8a91a3",
        brand: {
          DEFAULT: "#6c5ce7",
          bright: "#8b7aff",
        },
        up: "#16c784",
        down: "#ea3943",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
