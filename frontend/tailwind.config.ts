import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        "neon-green": "#22C55E",
        "neon-green-bright": "#39FF14",
        "crimson": "#EF4444",
        "electric-blue": "#2563EB",
        "electric-blue-dark": "#1D4ED8",
        "amber-warn": "#F59E0B",
        "purple-critical": "#7C3AED",
        // Dark mode surfaces — deep navy SOC palette
        "slate-950": "#020617",
        "slate-900": "#0F172A",
        "slate-850": "#1A2332",
        "slate-800": "#1E293B",
        "slate-750": "#243040",
        "slate-700": "#334155",
        "slate-600": "#475569",
        "slate-500": "#64748B",
        "slate-400": "#94A3B8",
        "slate-300": "#CBD5E1",
        "slate-200": "#E2E8F0",
        "slate-100": "#F1F5F9",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      boxShadow: {
        // Functional shadows only — no decorative glow
        "card": "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)",
        "card-md": "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
