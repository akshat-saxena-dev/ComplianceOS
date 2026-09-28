"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  HelpCircle,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { getUnrecognized, trainMapping } from "@/lib/api";

interface Mapping {
  raw_command: string;
  mapped_key: string;
  value_type: "boolean" | "string";
  mapped_value: string;
  saved: boolean;
  saving: boolean;
  ai_loading: boolean;
  error: string | null;
}

const SUGGESTED_KEYS = [
  "http_enabled",
  "https_enabled",
  "ssh_only",
  "telnet_enabled",
  "ntp_enabled",
  "logging_enabled",
  "snmpv3_only",
  "hostname",
  "custom_key",
];

const KNOWLEDGE_BASE_EXAMPLES = [
  { cmd: "set system services web-management http", key: "http_enabled", value: "true", vendor: "juniper" },
  { cmd: "ip http server", key: "http_enabled", value: "true", vendor: "cisco" },
  { cmd: "transport input telnet", key: "ssh_only", value: "false", vendor: "cisco" },
];

/* -------------------------------------------------------------------------- */
/* Toast                                                                      */
/* -------------------------------------------------------------------------- */

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 rounded-lg px-4 sm:px-5 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm shadow-lg border border-slate-700 dark:border-slate-200 animate-fade-in max-w-[calc(100vw-2rem)]">
      <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
      <span className="truncate">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile mapping card (< md)                                                 */
/* -------------------------------------------------------------------------- */

function MobileMappingCard({
  m,
  i,
  updateMapping,
  askAI,
  saveMapping,
}: {
  m: Mapping;
  i: number;
  updateMapping: (index: number, field: keyof Mapping, value: string) => void;
  askAI: (index: number) => void;
  saveMapping: (index: number) => void;
}) {
  return (
    <div
      className={`border-b border-slate-100 dark:border-slate-700/50 p-4 space-y-3
        ${m.saved ? "bg-green-50/60 dark:bg-green-900/10" : ""}`}
    >
      {/* Command */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Command #{i + 1}
        </p>
        <code className="block text-xs font-mono bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-1.5 rounded text-amber-700 dark:text-amber-warn break-all">
          {m.raw_command}
        </code>
      </div>

      {m.saved ? (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-mono text-slate-700 dark:text-slate-300">{m.mapped_key}</span>
          <span className="text-slate-400">{m.value_type}</span>
          <span className={`font-mono font-bold ${m.mapped_value === "true" ? "text-neon-green" : m.mapped_value === "false" ? "text-crimson" : "text-slate-500"}`}>
            {m.mapped_value}
          </span>
          <span className="flex items-center gap-1 text-neon-green font-semibold ml-auto">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        </div>
      ) : (
        <>
          {/* Map to key */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative flex-1">
              <select
                value={m.mapped_key}
                onChange={(e) => updateMapping(i, "mapped_key", e.target.value)}
                className="input-field appearance-none pr-7 text-xs"
              >
                {SUGGESTED_KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            {m.mapped_key === "custom_key" && (
              <input
                type="text"
                placeholder="enter_custom_key"
                className="input-field font-mono text-xs"
                onChange={(e) => updateMapping(i, "mapped_key", e.target.value)}
              />
            )}
          </div>

          {/* Type + value */}
          <div className="flex gap-2">
            <div className="relative w-28 flex-shrink-0">
              <select
                value={m.value_type}
                onChange={(e) => updateMapping(i, "value_type", e.target.value)}
                className="input-field appearance-none pr-7 text-xs"
              >
                <option value="boolean">Boolean</option>
                <option value="string">String</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            {m.value_type === "boolean" ? (
              <div className="relative w-24 flex-shrink-0">
                <select
                  value={m.mapped_value}
                  onChange={(e) => updateMapping(i, "mapped_value", e.target.value)}
                  className="input-field appearance-none pr-7 text-xs"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            ) : (
              <input
                type="text"
                value={m.mapped_value}
                onChange={(e) => updateMapping(i, "mapped_value", e.target.value)}
                placeholder="value..."
                className="input-field font-mono text-xs flex-1"
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => askAI(i)}
              disabled={m.ai_loading || m.saving}
              className="flex items-center justify-center rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-2 text-purple-600 dark:text-purple-400 transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/40 disabled:cursor-not-allowed disabled:opacity-50"
              title="Ask AI for mapping suggestion"
            >
              {m.ai_loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </button>
            <button
              onClick={() => saveMapping(i)}
              disabled={m.saving || m.ai_loading}
              className="flex items-center gap-1.5 rounded-lg bg-electric-blue hover:bg-electric-blue-dark px-3 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 flex-1 justify-center"
            >
              {m.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {m.saving ? "Saving..." : "Save Mapping"}
            </button>
          </div>
        </>
      )}

      {m.error && <p className="text-[10px] text-crimson">{m.error}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function TrainingPage() {
  const [vendor, setVendor] = useState("unknown");
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [backendError, setBackendError] = useState(false);

  const fetchUnrecognized = useCallback(async () => {
    setLoading(true);
    setBackendError(false);
    try {
      const data = await getUnrecognized();
      setVendor(data.vendor);
      setMappings(
        data.unrecognized.map((cmd) => ({
          raw_command: cmd,
          mapped_key: "http_enabled",
          value_type: "boolean",
          mapped_value: "false",
          saved: false,
          saving: false,
          ai_loading: false,
          error: null,
        }))
      );
    } catch {
      setBackendError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUnrecognized(); }, [fetchUnrecognized]);

  const updateMapping = (index: number, field: keyof Mapping, value: string) => {
    setMappings((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const updated = { ...m, [field]: value, error: null };
        if (field === "value_type") updated.mapped_value = value === "boolean" ? "false" : "";
        return updated;
      })
    );
  };

  const askAI = async (index: number) => {
    const m = mappings[index];
    setMappings((prev) => prev.map((mp, i) => i === index ? { ...mp, ai_loading: true } : mp));
    try {
      const response = await fetch("http://localhost:8000/api/suggest-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: m.raw_command }),
      });
      const data = await response.json();
      if (data.suggestion && data.suggestion !== "unknown") {
        updateMapping(index, "mapped_key", data.suggestion);
        setToast(`AI Suggestion applied: ${data.suggestion}`);
      } else {
        setToast("AI couldn't confidently map this command.");
      }
    } catch {
      setToast("AI is offline. Please map manually.");
    } finally {
      setMappings((prev) => prev.map((mp, i) => i === index ? { ...mp, ai_loading: false } : mp));
    }
  };

  const saveMapping = async (index: number) => {
    const m = mappings[index];
    if (!m.mapped_key.trim()) {
      setMappings((prev) => prev.map((mp, i) => i === index ? { ...mp, error: "Key cannot be empty." } : mp));
      return;
    }
    setMappings((prev) => prev.map((mp, i) => i === index ? { ...mp, saving: true, error: null } : mp));
    try {
      let finalValue: boolean | string = m.mapped_value;
      if (m.value_type === "boolean") finalValue = m.mapped_value === "true";
      await trainMapping({
        vendor: vendor === "unknown" ? "cisco" : vendor,
        raw_command: m.raw_command,
        mapped_key: m.mapped_key,
        mapped_value: finalValue,
      });
      setMappings((prev) => prev.map((mp, i) => i === index ? { ...mp, saved: true, saving: false } : mp));
      setToast(`Saved: "${m.raw_command}" → ${m.mapped_key}=${m.mapped_value}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setMappings((prev) => prev.map((mp, i) => i === index ? { ...mp, saving: false, error: msg } : mp));
    }
  };

  const unsavedCount = mappings.filter((m) => !m.saved).length;

  return (
    <div className="flex-1 min-h-screen bg-slate-100 dark:bg-[#0B1120] w-full overflow-x-hidden">

      <Navbar
        title="AI Training Hub"
        subtitle="Teach the engine to understand new or vendor-specific commands"
      />

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      <main className="mx-auto w-full max-w-[1600px] space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-8 min-w-0 overflow-x-hidden">

        {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-electric-blue" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Knowledge Base Editor
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Map unrecognized config commands to standardized compliance parameters.
                {vendor !== "unknown" && (
                  <span className="ml-2 font-semibold capitalize text-electric-blue">{vendor}</span>
                )}
              </p>
            </div>
          </div>

          <button onClick={fetchUnrecognized} disabled={loading} className="btn-secondary w-full text-sm sm:w-auto">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="card p-3 sm:p-4 text-center border-l-4 border-l-amber-warn">
            <p className="text-xl sm:text-2xl font-bold text-amber-warn">{mappings.length}</p>
            <p className="mt-1 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-tight">
              Total Unrecognized
            </p>
          </div>
          <div className="card p-3 sm:p-4 text-center border-l-4 border-l-crimson">
            <p className="text-xl sm:text-2xl font-bold text-crimson">{unsavedCount}</p>
            <p className="mt-1 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-tight">
              Pending Mappings
            </p>
          </div>
          <div className="card p-3 sm:p-4 text-center border-l-4 border-l-neon-green">
            <p className="text-xl sm:text-2xl font-bold text-neon-green">{mappings.length - unsavedCount}</p>
            <p className="mt-1 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-tight">
              Saved to KB
            </p>
          </div>
        </div>

        {/* Backend error */}
        {backendError && (
          <div className="card border-l-4 border-l-crimson p-4 sm:p-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-crimson flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-crimson">Backend Unavailable</p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Could not load unrecognized commands. Start the backend with{" "}
                  <code className="font-mono text-electric-blue bg-slate-100 dark:bg-slate-800 px-1 rounded break-all">
                    uvicorn main:app --reload --port 8000
                  </code>{" "}
                  and upload a config file first.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-electric-blue">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading unrecognized commands...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !backendError && mappings.length === 0 && (
          <div className="card p-10 sm:p-12 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
              <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-neon-green" />
            </div>
            <h3 className="mb-2 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Knowledge Base is Complete!
            </h3>
            <p className="mx-auto max-w-sm text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              All commands from the last uploaded config file have been recognized and mapped.
              Upload a new config to discover more unknown patterns.
            </p>
          </div>
        )}

        {/* Unrecognized commands */}
        {!loading && mappings.length > 0 && (
          <div className="panel animate-fade-in">
            <div className="panel-header justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-amber-warn flex-shrink-0" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Unrecognized Commands
                </h3>
              </div>
              <span className="rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-0.5 text-xs font-semibold text-amber-warn whitespace-nowrap">
                {unsavedCount} pending
              </span>
            </div>

            {/* Mobile card list — < md */}
            <div className="md:hidden">
              {mappings.map((m, i) => (
                <MobileMappingCard
                  key={i}
                  m={m}
                  i={i}
                  updateMapping={updateMapping}
                  askAI={askAI}
                  saveMapping={saveMapping}
                />
              ))}
            </div>

            {/* Desktop table — ≥ md */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {["#", "Unknown Command", "Map to Key", "Type", "Value", "Action"].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m, i) => (
                    <tr
                      key={i}
                      className={`border-b border-slate-100 dark:border-slate-700/50 transition-colors ${
                        m.saved ? "bg-green-50/60 dark:bg-green-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{i + 1}</td>
                      <td className="max-w-xs px-4 py-3">
                        <code className="block truncate rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-1 text-xs font-mono text-amber-700 dark:text-amber-warn">
                          {m.raw_command}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        {m.saved ? (
                          <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{m.mapped_key}</span>
                        ) : (
                          <div className="relative">
                            <select value={m.mapped_key} onChange={(e) => updateMapping(i, "mapped_key", e.target.value)} className="input-field min-w-[160px] appearance-none pr-7 text-xs">
                              {SUGGESTED_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          </div>
                        )}
                        {m.mapped_key === "custom_key" && !m.saved && (
                          <input type="text" placeholder="enter_custom_key" className="input-field mt-1.5 font-mono text-xs" onChange={(e) => updateMapping(i, "mapped_key", e.target.value)} />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {m.saved ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">{m.value_type}</span>
                        ) : (
                          <div className="relative">
                            <select value={m.value_type} onChange={(e) => updateMapping(i, "value_type", e.target.value)} className="input-field w-28 appearance-none pr-7 text-xs">
                              <option value="boolean">Boolean</option>
                              <option value="string">String</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {m.saved ? (
                          <span className={`text-xs font-mono font-bold ${m.mapped_value === "true" ? "text-neon-green" : m.mapped_value === "false" ? "text-crimson" : "text-slate-500"}`}>{m.mapped_value}</span>
                        ) : m.value_type === "boolean" ? (
                          <div className="relative">
                            <select value={m.mapped_value} onChange={(e) => updateMapping(i, "mapped_value", e.target.value)} className="input-field w-24 appearance-none pr-7 text-xs">
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          </div>
                        ) : (
                          <input type="text" value={m.mapped_value} onChange={(e) => updateMapping(i, "mapped_value", e.target.value)} placeholder="value..." className="input-field w-28 font-mono text-xs" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {m.saved ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-neon-green"><Check className="h-3.5 w-3.5" />Saved</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => askAI(i)} disabled={m.ai_loading || m.saving} className="flex items-center justify-center rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-1.5 text-purple-600 dark:text-purple-400 transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/40 disabled:cursor-not-allowed disabled:opacity-50" title="Ask AI">
                              {m.ai_loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            </button>
                            <button onClick={() => saveMapping(i)} disabled={m.saving || m.ai_loading} className="flex items-center gap-1.5 rounded-lg bg-electric-blue hover:bg-electric-blue-dark px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50">
                              {m.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                              {m.saving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        )}
                        {m.error && <p className="mt-1 text-[10px] text-crimson">{m.error}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Training loop explainer */}
        <div className="panel">
          <div className="panel-header">
            <HelpCircle className="h-4 w-4 text-electric-blue flex-shrink-0" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              How the Training Loop Works
            </h3>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
            {[
              { step: "1", title: "Upload Config", desc: "The parser finds lines it doesn't recognize in mappings.json and flags them here.", icon: "📤" },
              { step: "2", title: "Map the Command", desc: "Select the standard compliance key (e.g. http_enabled) and its boolean/string value.", icon: "🧠" },
              { step: "3", title: "Save & Re-Audit", desc: "The mapping is persisted to mappings.json. Future configs with the same line will be recognized automatically.", icon: "✅" },
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <div className="text-xl sm:text-2xl flex-shrink-0">{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-electric-blue">Step {s.step}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{s.title}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge base examples */}
        <div className="panel">
          <div className="panel-header">
            <BookOpen className="h-4 w-4 text-neon-green flex-shrink-0" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Knowledge Base — Reference Examples
            </h3>
          </div>

          {/* Mobile: stacked cards — avoids any min-w overflow */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
            {KNOWLEDGE_BASE_EXAMPLES.map((ex, i) => (
              <div key={i} className="p-4 space-y-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Raw Command</p>
                  <code className="block text-xs font-mono text-amber-700 dark:text-amber-warn bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded break-all">
                    {ex.cmd}
                  </code>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vendor: </span>
                    <span className="capitalize text-slate-600 dark:text-slate-400">{ex.vendor}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Key: </span>
                    <span className="font-mono text-electric-blue">{ex.key}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Value: </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{ex.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet+: proper table, contained scroll */}
          <div className="hidden sm:block p-4 sm:p-5 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {["Raw Command", "Vendor", "Mapped Key", "Value"].map((h) => (
                    <th key={h} className="pb-2 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {KNOWLEDGE_BASE_EXAMPLES.map((ex, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-2.5 font-mono text-amber-700 dark:text-amber-warn pr-4 break-all">{ex.cmd}</td>
                    <td className="py-2.5 capitalize text-slate-600 dark:text-slate-400 pr-4 whitespace-nowrap">{ex.vendor}</td>
                    <td className="py-2.5 font-mono text-electric-blue pr-4 whitespace-nowrap">{ex.key}</td>
                    <td className="py-2.5 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{ex.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}