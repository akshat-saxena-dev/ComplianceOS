"use client";

import Link from "next/link";
import {
  Shield,
  Network,
  FileDown,
  ArrowRight,
  Activity,
  Sun,
  Moon,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

/* -------------------------------------------------------------------------- */
/* Feature card                                                               */
/* -------------------------------------------------------------------------- */

function FeatureCard({
  icon,
  title,
  children,
  accentClass,
  step,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accentClass: string;
  step: string;
}) {
  return (
    <div className="card p-5 sm:p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accentClass}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
            Step {step}
          </p>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  // Use the shared ThemeProvider instead of a local disconnected state.
  // This ensures the toggle/icon on the landing page is in sync with the
  // rest of the app and persists across navigation/refresh.
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white">

      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          {/* Logo — clicking navigates home (stays on `/`) */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 min-w-0 group"
            aria-label="ComplianceOS — Home"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-electric-blue rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 group-hover:bg-electric-blue-dark transition-colors">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                ComplianceOS
              </span>
              <span className="hidden md:inline ml-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                CIS Benchmark Engine
              </span>
            </div>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-warn" />
              ) : (
                <Moon className="h-4 w-4 text-electric-blue" />
              )}
            </button>

            <Link
              href="/dashboard"
              className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <span className="hidden sm:inline">Open Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-electric-blue mb-6 sm:mb-8">
          <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>SIH Prototype</span>
        </div>

        <h1 className="max-w-4xl mx-auto text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white">
          Vendor-Agnostic{" "}
          <span className="sm:hidden"><br /></span>
          Network{" "}
          <span className="text-electric-blue">Compliance Engine</span>
        </h1>

        <p className="mt-5 sm:mt-6 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed text-slate-600 dark:text-slate-400 px-2">
          Instantly audit heterogeneous enterprise networks against CIS
          Benchmarks. Upload proprietary configurations, normalize them with AI,
          and generate actionable remediation paths in seconds.
        </p>

        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
          <Link
            href="/dashboard"
            className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 justify-center"
          >
            Try Now
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
          <Link
            href="/upload"
            className="btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 justify-center"
          >
            Upload Config
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-x-4 sm:gap-x-8 gap-y-2 sm:gap-y-3 text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider px-4">
          {["CIS Controls v8", "Cisco IOS", "Juniper JunOS", "Palo Alto PANOS", "PDF Export"].map(
            (badge) => (
              <span key={badge} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neon-green flex-shrink-0" />
                {badge}
              </span>
            )
          )}
        </div>
      </main>

      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-800" />

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-8 sm:mb-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            How it Works
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            A seamless pipeline from raw device config to complete security compliance.
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<Network className="h-4 w-4 sm:h-5 sm:w-5 text-electric-blue" />}
            title="AI Normalization"
            accentClass="bg-blue-50 dark:bg-blue-900/20"
            step="01"
          >
            Upload raw CLI syntax from Cisco, Juniper, or Palo Alto. Our
            engine automatically translates proprietary formats into a
            universal schema.
          </FeatureCard>

          <FeatureCard
            icon={<Shield className="h-4 w-4 sm:h-5 sm:w-5 text-neon-green" />}
            title="Deterministic Audits"
            accentClass="bg-green-50 dark:bg-green-900/20"
            step="02"
          >
            We eliminate AI hallucinations by evaluating normalized
            configurations against rigid CIS frameworks using strict
            heuristic logic.
          </FeatureCard>

          <FeatureCard
            icon={<FileDown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-critical" />}
            title="Actionable Remediation"
            accentClass="bg-purple-50 dark:bg-purple-900/20"
            step="03"
          >
            Download comprehensive PDF reports that provide the exact,
            vendor-specific CLI commands needed to harden your non-compliant
            devices.
          </FeatureCard>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-slate-400 dark:text-slate-600 text-center sm:text-left">
          <span className="font-mono">ComplianceOS v1.0.0 · SIH Hackathon Build</span>
          <span>CIS Controls v8 · Network Device Benchmark</span>
        </div>
      </div>
    </div>
  );
}