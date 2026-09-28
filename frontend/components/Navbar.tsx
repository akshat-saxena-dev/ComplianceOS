"use client";

import { Bell, Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useSidebar } from "./SidebarContext";

interface NavbarProps {
  title?: string;
  subtitle?: string;
}

export default function Navbar({
  title = "Dashboard",
  subtitle,
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { isOpen, toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-3">

        {/* Left: hamburger (mobile) + page title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger — visible only on < lg */}
          <button
            onClick={toggle}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="lg:hidden flex-shrink-0 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Notification bell */}
          <button
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-crimson" />
          </button>

          {/* Dark / Light toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-200"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-warn flex-shrink-0" />
                <span className="hidden sm:inline text-xs">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-electric-blue flex-shrink-0" />
                <span className="hidden sm:inline text-xs">Dark</span>
              </>
            )}
          </button>

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-electric-blue flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}