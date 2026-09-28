"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

/**
 * Determine the correct initial theme:
 * 1. Honour an explicitly stored user preference (localStorage).
 * 2. Fall back to the OS/system colour-scheme preference.
 * 3. Default to "dark" if neither is available.
 *
 * This runs on the client only, so it is safe to access window/localStorage.
 */
function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "dark" || stored === "light") return stored;
    // System preference
    if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  } catch {
    // SSR / localStorage blocked — fall through
  }
  return "dark";
}

/** Apply the theme to the <html> element immediately (no re-render lag). */
function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with "dark" so the SSR HTML and initial client render agree,
  // then correct immediately in the effect (before first paint via useLayoutEffect).
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
  };

  // While not yet mounted we still render children so the page structure is
  // visible — we just suppress theme-sensitive icons/state via `mounted`.
  // This avoids the full-blank-flash caused by returning null.
  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : "dark", toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
