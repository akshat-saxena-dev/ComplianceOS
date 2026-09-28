"use client";

import { useEffect, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MonitorCheck,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  getStats,
  getHistory,
  getLastAudit,
  type StatsResponse,
  type HistoryEntry,
  type AuditResponse,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Stat card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ElementType;
  accent: "blue" | "green" | "red" | "amber";
  trend?: { value: number; label: string; positive: boolean };
}) {
  const colors = {
    blue: {
      icon: "bg-blue-50 dark:bg-blue-900/20 text-electric-blue",
      value: "text-electric-blue",
      border: "border-l-4 border-l-electric-blue",
    },
    green: {
      icon: "bg-green-50 dark:bg-green-900/20 text-neon-green",
      value: "text-neon-green",
      border: "border-l-4 border-l-neon-green",
    },
    red: {
      icon: "bg-red-50 dark:bg-red-900/20 text-crimson",
      value: "text-crimson",
      border: "border-l-4 border-l-crimson",
    },
    amber: {
      icon: "bg-amber-50 dark:bg-amber-900/20 text-amber-warn",
      value: "text-amber-warn",
      border: "border-l-4 border-l-amber-warn",
    },
  };
  const c = colors[accent];

  return (
    <div className={`card p-4 sm:p-5 ${c.border} animate-fade-in`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 truncate">
            {title}
          </p>
          <p className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none ${c.value}`}>
            {value}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 truncate">
            {subtitle}
          </p>
        </div>
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${c.icon}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${trend.positive ? "text-neon-green" : "text-crimson"}`}>
            {trend.positive ? "▲" : "▼"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Panel wrapper                                                              */
/* -------------------------------------------------------------------------- */

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`panel ${className}`}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse>({
    total_devices: 0,
    compliant: 0,
    action_required: 0,
    last_scan: null,
    compliance_by_vendor: {},
    compliance_by_rule: {},
    avg_scan_time_ms: null,
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastAudit, setLastAudit] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsData, historyData, auditData] = await Promise.all([
        getStats(),
        getHistory(),
        getLastAudit(),
      ]);
      setStats(statsData);
      setHistory(historyData.history);
      setLastAudit(auditData);
    } catch {
      // Keep existing data if backend is unavailable.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const complianceRate =
    stats.total_devices > 0
      ? Math.round((stats.compliant / stats.total_devices) * 100)
      : 0;

  const formatLastScan = (ts: string | null) => {
    if (!ts) return "Never";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  const complianceColor =
    complianceRate >= 80
      ? "text-neon-green"
      : complianceRate >= 60
        ? "text-amber-warn"
        : "text-crimson";

  const vendorColors: Record<string, string> = {
    cisco: "bg-electric-blue",
    juniper: "bg-neon-green",
    "palo alto": "bg-purple-critical",
  };

  const vendorCompliance = Object.entries(stats.compliance_by_vendor ?? {}).map(
    ([vendor, data]) => ({
      vendor,
      total: data.total,
      compliant: data.compliant,
      color: vendorColors[vendor] ?? "bg-electric-blue",
    }),
  );

  return (
    <div className="flex-1 min-h-screen bg-slate-100 dark:bg-[#0B1120]">
      <Navbar
        title="Dashboard"
        subtitle="Real-time network compliance overview"
      />

      <main className="mx-auto w-full max-w-[1600px] space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-8">

        {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Security Posture Overview
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Last scan: {formatLastScan(stats.last_scan)}
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="btn-secondary w-full text-sm sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            title="Total Devices"
            value={stats.total_devices}
            subtitle="Managed network devices"
            icon={Server}
            accent="blue"
          />
          <StatCard
            title="Compliant"
            value={stats.compliant}
            subtitle={`${complianceRate}% compliance rate`}
            icon={ShieldCheck}
            accent="green"
          />
          <StatCard
            title="Action Required"
            value={stats.action_required}
            subtitle="Devices with failures"
            icon={AlertTriangle}
            accent="red"
          />
          <StatCard
            title="Avg Scan Time"
            value={
              stats.avg_scan_time_ms !== null
                ? `${(stats.avg_scan_time_ms / 1000).toFixed(2)}s`
                : "—"
            }
            subtitle="Per device audit"
            icon={Clock}
            accent="amber"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
          {/* Compliance gauge */}
          <Panel>
            <div className="panel-header">
              <MonitorCheck className="h-4 w-4 text-electric-blue flex-shrink-0" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                Overall Compliance
              </h3>
            </div>
            <div className="p-4 sm:p-5 flex flex-col items-center">
              <div className="relative h-32 w-32 sm:h-36 sm:w-36">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                    className="stroke-slate-200 dark:stroke-slate-700" />
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                    strokeDasharray={`${(complianceRate / 100) * 264} 264`}
                    strokeLinecap="round"
                    className={
                      complianceRate >= 80 ? "stroke-neon-green"
                        : complianceRate >= 60 ? "stroke-amber-warn"
                        : "stroke-crimson"
                    }
                    style={{ transition: "stroke-dasharray 1.2s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl sm:text-3xl font-bold ${complianceColor}`}>
                    {complianceRate}%
                  </span>
                  <span className="mt-0.5 text-xs text-slate-400">Compliant</span>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-neon-green flex-shrink-0" />
                  Compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-crimson flex-shrink-0" />
                  Non-compliant
                </span>
              </div>
            </div>
          </Panel>

          {/* Vendor breakdown */}
          <Panel className="lg:col-span-2">
            <div className="panel-header">
              <Wifi className="h-4 w-4 text-electric-blue flex-shrink-0" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                Compliance by Vendor
              </h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
              {vendorCompliance.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-3">
                  No vendor data yet. Upload a config to get started.
                </p>
              ) : (
                vendorCompliance.map((v) => {
                  const pct = Math.round((v.compliant / v.total) * 100);
                  return (
                    <div key={v.vendor}>
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="font-semibold capitalize text-slate-700 dark:text-slate-300 truncate mr-2">
                          {v.vendor}
                        </span>
                        <span className="text-slate-500 flex-shrink-0">
                          {v.compliant}/{v.total} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${v.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        </div>

        {/* Recent activity */}
        <Panel>
          <div className="panel-header justify-between flex-row flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-electric-blue flex-shrink-0" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Recent Audit Activity
              </h3>
            </div>
            <span className="rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-2.5 py-0.5 text-xs font-semibold text-electric-blue">
              Latest 5
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {history.length === 0 ? (
              <div className="px-4 sm:px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No audits yet. Upload a config file to begin.
              </div>
            ) : (
              [...history]
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime(),
                )
                .slice(0, 5)
                .map((item) => {
                  const passed = item.summary.passed;
                  const failed = item.summary.failed;
                  const isPass = failed === 0;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isPass
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "bg-red-50 dark:bg-red-900/20"
                        }`}
                      >
                        {isPass ? (
                          <ShieldCheck className="h-4 w-4 text-neon-green" />
                        ) : (
                          <ShieldAlert className="h-4 w-4 text-crimson" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.hostname}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.vendor} · {passed}/{item.summary.total} passed
                          {failed > 0 ? ` · ${failed} failed` : ""}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={`text-xs font-bold ${isPass ? "text-neon-green" : "text-crimson"}`}>
                          {isPass ? "PASS" : "FAIL"}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:block whitespace-nowrap">
                          {formatLastScan(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </Panel>

        {/* CIS rules */}
        <Panel>
          <div className="panel-header">
            <CheckCircle2 className="h-4 w-4 text-electric-blue flex-shrink-0" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
              CIS Benchmark Compliance by Rule
            </h3>
          </div>
          <div className="p-3 sm:p-5">
            {Object.keys(stats.compliance_by_rule ?? {}).length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                No rule data yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {Object.entries(stats.compliance_by_rule ?? {}).map(
                  ([ruleId, rule]) => {
                    const total = rule.pass + rule.fail + rule.skipped;
                    const pct = total > 0 ? Math.round((rule.pass / total) * 100) : 0;
                    const fullyPass = rule.fail === 0 && rule.pass > 0;
                    const hasOnlySkipped =
                      rule.pass === 0 && rule.fail === 0 && rule.skipped > 0;

                    return (
                      <div
                        key={ruleId}
                        className="card p-2.5 sm:p-3 text-center hover:shadow-md transition-shadow"
                      >
                        <p className="font-mono text-[9px] sm:text-[10px] uppercase text-slate-400 dark:text-slate-500 truncate">
                          {ruleId}
                        </p>
                        <p className="mb-1.5 mt-0.5 text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                          {rule.name}
                        </p>
                        <p
                          className={`text-lg sm:text-xl font-bold ${
                            hasOnlySkipped
                              ? "text-slate-400"
                              : fullyPass
                                ? "text-neon-green"
                                : pct >= 60
                                  ? "text-amber-warn"
                                  : "text-crimson"
                          }`}
                        >
                          {hasOnlySkipped ? "N/C" : `${pct}%`}
                        </p>
                        <p className="mt-0.5 text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500">
                          {hasOnlySkipped
                            ? `${rule.skipped} not configured`
                            : `${rule.pass}/${total} pass`}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </Panel>
      </main>
    </div>
  );
}
