"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { downloadReport, getHistory, type HistoryEntry } from "@/lib/api";

function VendorChip({ vendor }: { vendor: string }) {
  const map: Record<string, string> = {
    cisco: "bg-blue-50 dark:bg-blue-900/20 text-electric-blue border-blue-200 dark:border-blue-800",
    juniper: "bg-green-50 dark:bg-green-900/20 text-neon-green border-green-200 dark:border-green-800",
    palo_alto: "bg-purple-50 dark:bg-purple-900/20 text-purple-critical border-purple-200 dark:border-purple-800",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border whitespace-nowrap ${
      map[vendor] ?? "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600"
    }`}>
      {vendor.replace("_", " ")}
    </span>
  );
}

function ScoreBadge({ summary }: { summary: HistoryEntry["summary"] }) {
  const pct = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
  const color = pct >= 80 ? "text-neon-green" : pct >= 60 ? "text-amber-warn" : "text-crimson";
  return <span className={`text-base sm:text-lg font-bold tabular-nums ${color}`}>{pct}%</span>;
}

/* -------------------------------------------------------------------------- */
/* Mobile history card (< md)                                                 */
/* -------------------------------------------------------------------------- */

function MobileHistoryCard({
  entry,
  isLatest,
  formatDate,
}: {
  entry: HistoryEntry;
  isLatest: boolean;
  formatDate: (s: string) => string;
}) {
  const pct =
    entry.summary.total > 0
      ? Math.round((entry.summary.passed / entry.summary.total) * 100)
      : 0;

  return (
    <div className="border-b border-slate-100 dark:border-slate-700/50 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
      {/* Top: filename + score */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileText className="h-3.5 w-3.5 shrink-0 text-electric-blue" />
            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
              {entry.filename}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Server className="h-3 w-3 text-slate-400 flex-shrink-0" />
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate">
              {entry.hostname}
            </span>
          </div>
        </div>
        <ScoreBadge summary={entry.summary} />
      </div>

      {/* Bottom: vendor, results, timestamp, download */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2">
          <VendorChip vendor={entry.vendor} />
          <span className="flex items-center gap-1 text-xs font-semibold text-neon-green">
            <CheckCircle2 className="h-3 w-3" />{entry.summary.passed}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-crimson">
            <XCircle className="h-3 w-3" />{entry.summary.failed}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(entry.timestamp)}
          </span>
          {isLatest && (
            <button
              onClick={downloadReport}
              className="flex items-center gap-1 text-xs font-semibold text-electric-blue hover:text-electric-blue-dark transition-colors"
            >
              <Download className="h-3.5 w-3.5" />PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function ReportsPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getHistory();
      setHistory(data.history.slice().reverse());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-100 dark:bg-[#0B1120]">

      <Navbar
        title="Reports"
        subtitle="Audit history and downloadable compliance reports"
      />

      <main className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Audit History
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              All compliance scans from the current session
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={fetchHistory} disabled={loading} className="btn-secondary text-sm justify-center">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button onClick={downloadReport} className="btn-primary text-sm justify-center">
              <Download className="h-4 w-4" />
              Download Latest PDF
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="card border-l-4 border-l-crimson p-4 sm:p-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-crimson" />
              <div>
                <p className="text-sm font-semibold text-crimson">Backend Unavailable</p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Could not load audit history. Make sure the backend is running on port 8000.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-electric-blue">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading history...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && history.length === 0 && (
          <div className="card p-10 sm:p-12 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="mb-2 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              No Reports Yet
            </h3>
            <p className="mx-auto max-w-sm text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Upload a device configuration file from the{" "}
              <strong>Upload Config</strong> page to generate your first compliance report.
            </p>
          </div>
        )}

        {/* History — mobile card list */}
        {!loading && history.length > 0 && (
          <>
            {/* Mobile cards — < md */}
            <div className="panel md:hidden animate-fade-in">
              {history.map((entry, i) => (
                <MobileHistoryCard
                  key={`${entry.id}-${entry.timestamp}`}
                  entry={entry}
                  isLatest={i === 0}
                  formatDate={formatDate}
                />
              ))}
            </div>

            {/* Desktop table — ≥ md */}
            <div className="panel hidden md:block animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                      {["#", "File", "Device", "Vendor", "Score", "Results", "Timestamp", "Report"].map((h, idx) => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${idx === 7 ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry, i) => (
                      <tr
                        key={`${entry.id}-${entry.timestamp}`}
                        className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-400">#{entry.id}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-electric-blue" />
                            <span className="max-w-[140px] truncate font-mono text-xs text-slate-700 dark:text-slate-300">
                              {entry.filename}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Server className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{entry.hostname}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><VendorChip vendor={entry.vendor} /></td>
                        <td className="px-4 py-3.5"><ScoreBadge summary={entry.summary} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="flex items-center gap-1 font-semibold text-neon-green">
                              <CheckCircle2 className="h-3 w-3" />{entry.summary.passed}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-crimson">
                              <XCircle className="h-3 w-3" />{entry.summary.failed}
                            </span>
                            {entry.summary.skipped > 0 && (
                              <span className="text-slate-500 dark:text-slate-400">{entry.summary.skipped} skip</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">{formatDate(entry.timestamp)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {i === 0 ? (
                            <button
                              onClick={downloadReport}
                              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-electric-blue hover:text-electric-blue-dark transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" />PDF
                            </button>
                          ) : (
                            <span className="ml-auto flex items-center gap-1 text-xs text-slate-400 dark:text-slate-600">
                              <Clock className="h-3 w-3" />Archived
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* PDF download card */}
        <div className="card border-l-4 border-l-electric-blue p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-electric-blue" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Latest Audit PDF Report
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Generates a formatted PDF with all audit results, compliance
                  score, and remediation commands for the most recent scan.
                </p>
              </div>
            </div>
            <button onClick={downloadReport} className="btn-primary justify-center w-full sm:w-auto">
              <Download className="h-4 w-4" />
              Download PDF Report
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}