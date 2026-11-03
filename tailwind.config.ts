import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        valoria: {
          950: "#070a09",
          900: "#0b0f0e",
          850: "#101614",
          800: "#151d19",
          750: "#1b2520",
          700: "#222e28",
          600: "#2d3d36",
          500: "#3d5248",
          emerald: {
            DEFAULT: "#10b981",
            light: "#34d399",
            dark: "#059669",
            deep: "#064e3b",
            glow: "rgba(16, 185, 129, 0.25)",
          },
          grass: {
            DEFAULT: "#22c55e",
            light: "#4ade80",
            dark: "#16a34a",
          },
          gold: {
            DEFAULT: "#eab308",
            light: "#facc15",
            dark: "#ca8a04",
            subtle: "rgba(234, 179, 8, 0.15)",
          },
          amber: "#f59e0b",
          red: "#ef4444",
          blue: "#38bdf8",
          purple: "#a855f7",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Cascadia Code",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        pixel: [
          "'Press Start 2P'",
          "'Courier New'",
          "monospace",
        ],
      },
      boxShadow: {
        "emerald-glow": "0 0 25px -5px rgba(16, 185, 129, 0.25)",
        "emerald-sm": "0 0 12px -2px rgba(16, 185, 129, 0.35)",
        "gold-glow": "0 0 20px -4px rgba(234, 179, 8, 0.25)",
        "card-glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "inner-glow": "inset 0 1px 0 0 rgba(255, 255, 255, 0.07)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "mesh-pattern": "radial-gradient(rgba(16, 185, 129, 0.04) 1px, transparent 1px)",
        "grid-pattern": "linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "status-beacon": "beacon 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        beacon: {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "70%": { transform: "scale(2.2)", opacity: "0" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

