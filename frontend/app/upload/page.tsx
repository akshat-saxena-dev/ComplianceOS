"use client";

import { useState } from "react";
import { Download, FileWarning, Scan, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import FileUploadZone from "@/components/FileUploadZone";
import AuditResultsTable, { type AuditResult } from "@/components/AuditResultsTable";
import { uploadConfig, downloadReport, type AuditResponse } from "@/lib/api";

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File, vendor: string) => {
    setLoading(true);
    setError(null);
    setAuditResult(null);

    try {
      const result = await uploadConfig(file, vendor);
      setAuditResult(result);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to the compliance engine. Make sure the backend is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-100 dark:bg-[#0B1120] w-full overflow-x-hidden">

      <Navbar
        title="Upload Config"
        subtitle="Upload a device configuration file to run a CIS Benchmark audit"
      />

      <main className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 min-w-0 overflow-x-hidden">

        {/* Upload card */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-electric-blue" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                Configuration File Upload
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Supports Cisco IOS, Juniper JunOS, Palo Alto PANOS formats
              </p>
            </div>
          </div>
          <FileUploadZone onUpload={handleUpload} loading={loading} />
        </div>

        {/* Backend connection error */}
        {error && (
          <div className="card border-l-4 border-l-crimson p-4 sm:p-5 animate-fade-in">
            <div className="flex items-start gap-3">
              <FileWarning className="w-5 h-5 text-crimson flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-crimson">Audit Failed</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 break-words">
                  {error}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono break-all">
                  → Make sure backend is running:{" "}
                  <span className="text-electric-blue">
                    uvicorn main:app --reload --port 8000
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {auditResult && !loading && (
          <div className="space-y-4 animate-fade-in">

            {/* Results header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <Scan className="w-4 h-4 text-neon-green" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                    Audit Results
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {auditResult.filename} ·{" "}
                    {new Date(auditResult.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={downloadReport}
                className="btn-primary text-sm w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" />
                Download PDF Report
              </button>
            </div>

            <AuditResultsTable
              results={auditResult.results as AuditResult[]}
              vendor={auditResult.vendor}
              hostname={auditResult.hostname}
              timestamp={auditResult.timestamp}
              summary={auditResult.summary}
            />

            {/* Unrecognized commands notice */}
            {auditResult.unrecognized &&
              auditResult.unrecognized.length > 0 && (
                <div className="card border-l-4 border-l-amber-warn p-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <FileWarning className="w-4 h-4 text-amber-warn flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-warn">
                        {auditResult.unrecognized.length} Unrecognized Command
                        {auditResult.unrecognized.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        The following config lines could not be mapped to known
                        parameters. Visit the{" "}
                        <strong>AI Training Hub</strong> to teach the engine
                        what they mean.
                      </p>
                      <div className="mt-2 space-y-1">
                        {auditResult.unrecognized.slice(0, 5).map((cmd, i) => (
                          <code
                            key={i}
                            className="block text-xs font-mono bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded text-amber-700 dark:text-amber-warn break-all"
                          >
                            {cmd}
                          </code>
                        ))}
                        {auditResult.unrecognized.length > 5 && (
                          <p className="text-xs text-slate-400">
                            +{auditResult.unrecognized.length - 5} more in AI Training Hub
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Tips — shown when no results yet */}
        {!auditResult && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                title: "Cisco IOS",
                desc: "Upload running-config or startup-config exports from IOS/IOS-XE devices.",
                example: "show running-config | redirect tftp://...",
                accent: "border-l-electric-blue",
              },
              {
                title: "Juniper JunOS",
                desc: "Upload 'set' format configuration from JunOS routers and firewalls.",
                example: "show configuration | display set | save ...",
                accent: "border-l-neon-green",
              },
              {
                title: "Palo Alto PANOS",
                desc: "Upload CLI set-format exports from Palo Alto firewalls.",
                example: "scp export configuration ...",
                accent: "border-l-purple-critical",
              },
            ].map((tip) => (
              <div key={tip.title} className={`card border-l-4 ${tip.accent} p-4`}>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {tip.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {tip.desc}
                </p>
                <code className="text-[10px] font-mono text-electric-blue bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded block break-all">
                  {tip.example}
                </code>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}