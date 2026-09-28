"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Brain,
  FileText,
  Shield,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/upload", label: "Upload Config", icon: Upload },
  { href: "/training", label: "AI Training Hub", icon: Brain },
  { href: "/reports", label: "Reports", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  if (pathname === "/") {
    return null;
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Mobile backdrop — shown when sidebar is open on small screens       */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 lg:hidden
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
        onClick={close}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Sidebar panel                                                        */}
      {/* ------------------------------------------------------------------ */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 flex flex-col z-40
          bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-800
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        {/* Logo — clicking navigates to the home / landing page */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-3 min-w-0 group"
            aria-label="ComplianceOS — Home"
          >
            <div className="w-9 h-9 bg-electric-blue rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 group-hover:bg-electric-blue-dark transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                ComplianceOS
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider truncate">
                CIS Benchmark Engine
              </p>
            </div>
          </Link>

          {/* Close button — mobile only */}
          <button
            onClick={close}
            className="lg:hidden flex-shrink-0 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-3">
            Main Menu
          </p>

          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                  ${
                    active
                      ? "bg-blue-50 dark:bg-blue-900/20 text-electric-blue border-l-2 border-electric-blue pl-[10px]"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border-l-2 border-transparent pl-[10px]"
                  }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    active
                      ? "text-electric-blue"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                  }`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            <Zap className="w-3 h-3 text-electric-blue flex-shrink-0" />
            <span className="font-mono truncate">v1.0.0 · Hackathon Build</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            <BookOpen className="w-3 h-3 text-neon-green flex-shrink-0" />
            <span>CIS Controls v8</span>
          </div>
        </div>
      </aside>
    </>
  );
}