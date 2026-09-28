"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MinusCircle,
  Terminal,
  XCircle,
} from "lucide-react";

export interface AuditResult {
  rule_id: string;
  name: string;
  description: string;
  severity: string;
  parameter: string;
  expected_value: boolean | string;
  actual_value: boolean | string | null;
  status: "PASS" | "FAIL" | "SKIPPED";
  remediation: string | null;
}

interface AuditResultsTableProps {
  results: AuditResult[];
  vendor: string;
  hostname: string;
  timestamp: string;
  summary: { total: number; passed: number; failed: number; skipped: number };
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    CRITICAL: "bg-purple-critical/15 text-purple-critical border-purple-critical/30",
    HIGH: "bg-crimson/15 text-crimson border-crimson/30",
    MEDIUM: "bg-amber-warn/15 text-amber-warn border-amber-warn/30",
    LOW: "bg-electric-blue/15 text-electric-blue border-electric-blue/30",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${map[severity] ?? map.LOW}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PASS") return <span className="badge-pass"><CheckCircle2 className="w-3 h-3" />PASS</span>;
  if (status === "FAIL") return <span className="badge-fail"><XCircle className="w-3 h-3" />FAIL</span>;
  return <span className="badge-skip"><MinusCircle className="w-3 h-3" />SKIP</span>;
}

/* ------------------------------------------------------------------ */
/* Mobile card (< md)                                                   */
/* ------------------------------------------------------------------ */
function MobileResultCard({ result }: { result: AuditResult }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border-b border-slate-100 dark:border-slate-700/50 px-4 py-3
        ${result.status === "FAIL" ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}
    >
      {/* Top row: rule name + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {result.name}
          </p>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
            {result.rule_id}
          </p>
        </div>
        <StatusBadge status={result.status} />
      </div>

      {/* Second row: severity + expected/actual */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <SeverityBadge severity={result.severity} />
        <span className="text-slate-400 dark:text-slate-500">
          Expected: <span className="font-mono text-slate-600 dark:text-slate-300">{String(result.expected_value)}</span>
        </span>
        <span className="text-slate-400 dark:text-slate-500">
          Got:{" "}
          {result.actual_value !== null ? (
            <span className="font-mono text-slate-600 dark:text-slate-300">{String(result.actual_value)}</span>
          ) : (
            <span className="italic text-slate-400">not found</span>
          )}
        </span>
      </div>

      {/* Fix button + remediation block */}
      {result.status === "FAIL" && result.remediation && (
        <div className="mt-2">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 text-xs text-electric-blue hover:text-electric-blue-dark font-medium transition-colors"
          >
            {open ? "Hide" : "Show"} Fix
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {open && (
            <div className="mt-2 rounded-lg border border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 border-b border-slate-700">
                <Terminal className="w-3.5 h-3.5 text-neon-green flex-shrink-0" />
                <span className="text-xs font-mono font-bold text-neon-green uppercase tracking-wide">
                  Remediation Command
                </span>
              </div>
              <pre className="text-xs font-mono text-neon-green bg-slate-900 p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
                {result.remediation}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop table row (≥ md)                                             */
/* ------------------------------------------------------------------ */
function ResultRow({ result }: { result: AuditResult }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors
                      ${result.status === "FAIL" ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}>
        <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {result.rule_id}
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{result.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{result.description}</p>
        </td>
        <td className="px-4 py-3">
          <SeverityBadge severity={result.severity} />
        </td>
        <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300">
          {String(result.expected_value)}
        </td>
        <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300">
          {result.actual_value !== null ? String(result.actual_value) : <span className="text-slate-400 italic">not found</span>}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={result.status} />
        </td>
        <td className="px-4 py-3 text-right">
          {result.status === "FAIL" && result.remediation ? (
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1 text-xs text-electric-blue hover:text-electric-blue-dark font-medium transition-colors ml-auto"
            >
              Fix
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
          )}
        </td>
      </tr>
      {open && result.status === "FAIL" && result.remediation && (
        <tr className="bg-slate-900/95 dark:bg-slate-950">
          <td colSpan={7} className="px-4 pb-4 pt-2">
            <div className="rounded-lg border border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 border-b border-slate-700">
                <Terminal className="w-3.5 h-3.5 text-neon-green" />
                <span className="text-xs font-mono font-bold text-neon-green uppercase tracking-wide">
                  Remediation Command
                </span>
              </div>
              <pre className="text-xs font-mono text-neon-green bg-slate-900 p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {result.remediation}
              </pre>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Main export                                                           */
/* ------------------------------------------------------------------ */
export default function AuditResultsTable({
  results,
  vendor,
  hostname,
  timestamp,
  summary,
}: AuditResultsTableProps) {
  const scorePercent = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
  const scoreColor =
    scorePercent >= 80 ? "text-neon-green" : scorePercent >= 50 ? "text-amber-warn" : "text-crimson";
  const circumference = 2 * Math.PI * 36;
  const strokeDash = (scorePercent / 100) * circumference;

  return (
    <div className="animate-fade-in min-w-0 w-full">
      {/* Summary header */}
      <div className="card p-4 sm:p-5 mb-4 flex flex-wrap gap-4 sm:gap-6 items-center overflow-hidden">
        {/* Circular gauge */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6"
              className="text-slate-200 dark:text-slate-700" />
            <circle cx="40" cy="40" r="36" fill="none" strokeWidth="6"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              className={scorePercent >= 80 ? "stroke-neon-green" : scorePercent >= 50 ? "stroke-amber-warn" : "stroke-crimson"}
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-base sm:text-lg font-bold ${scoreColor}`}>{scorePercent}%</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Device</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono truncate">{hostname}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Vendor</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{vendor}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Passed</p>
            <p className="text-sm font-bold text-neon-green">{summary.passed}/{summary.total}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Failed</p>
            <p className="text-sm font-bold text-crimson">{summary.failed}/{summary.total}</p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile card list — < md                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="card overflow-hidden md:hidden">
        {results.map((r) => (
          <MobileResultCard key={r.rule_id} result={r} />
        ))}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Desktop table — ≥ md                                             */}
      {/* ---------------------------------------------------------------- */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rule ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rule Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expected</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actual</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <ResultRow key={r.rule_id} result={r} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
