"use client";

import { useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Upload, X } from "lucide-react";

interface FileUploadZoneProps {
  onUpload: (file: File, vendor: string) => Promise<void>;
  loading: boolean;
}

const VENDOR_OPTIONS = [
  { value: "auto", label: "Auto-Detect" },
  { value: "cisco", label: "Cisco IOS" },
  { value: "juniper", label: "Juniper JunOS" },
  { value: "palo_alto", label: "Palo Alto PANOS" },
];

export default function FileUploadZone({
  onUpload,
  loading,
}: FileUploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [vendor, setVendor] = useState("auto");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidFile = (f: File) =>
    [".txt", ".conf", ".cfg", ".log"].some((ext) =>
      f.name.toLowerCase().endsWith(ext)
    );

  const handleFile = (f: File) => {
    if (!isValidFile(f)) {
      setError("Invalid file type. Please upload a .txt, .conf, or .cfg file.");
      return;
    }
    setError(null);
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const handleSubmit = async () => {
    if (!file) return;
    setError(null);
    try {
      await onUpload(file, vendor);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    }
  };

  const clear = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Vendor selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full min-w-0">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
          Device Vendor:
        </label>
        <select
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          className="input-field w-full max-w-full min-w-0 sm:flex-1 sm:max-w-xs"
          style={{ maxWidth: "100%" }}
          disabled={loading}
        >
          {VENDOR_OPTIONS.map((v) => (
            <option key={v.value} value={v.value} className="bg-white dark:bg-slate-800">
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        className={`rounded-xl border-2 border-dashed p-6 sm:p-10 text-center cursor-pointer transition-all duration-200 w-full min-w-0 overflow-hidden
          ${
            dragging
              ? "border-electric-blue bg-blue-50 dark:bg-blue-900/10"
              : file
              ? "border-neon-green bg-green-50 dark:bg-green-900/10"
              : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-electric-blue hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
          }
        `}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.conf,.cfg,.log"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {file ? (
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-neon-green" />
            </div>
            <div className="w-full min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base break-all">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {(file.size / 1024).toFixed(1)} KB · Ready to audit
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); clear(); }}
              className="absolute top-0 right-0 p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-crimson transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border flex items-center justify-center transition-colors ${
                dragging
                  ? "bg-blue-100 dark:bg-blue-900/30 border-electric-blue/40"
                  : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              }`}
            >
              {dragging ? (
                <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-electric-blue" />
              ) : (
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <div>
              <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">
                {dragging ? "Drop it here!" : "Drag & drop your config file"}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                or{" "}
                <span className="text-electric-blue font-medium cursor-pointer hover:underline">
                  browse to upload
                </span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                Supports .txt · .conf · .cfg · .log
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-crimson animate-fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="break-words min-w-0">{error}</span>
        </div>
      )}

      {/* Submit */}
      {file && !loading && (
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
          <button onClick={handleSubmit} className="btn-primary w-full sm:flex-1 justify-center py-3">
            <Upload className="w-4 h-4 flex-shrink-0" />
            Run Compliance Audit
          </button>
          <button onClick={clear} className="btn-secondary w-full sm:w-auto justify-center sm:px-4">
            <X className="w-4 h-4 flex-shrink-0" />
            Clear
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-4 text-electric-blue animate-pulse">
          <div className="w-5 h-5 border-2 border-electric-blue border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span className="text-sm font-medium">
            Parsing config &amp; running audit...
          </span>
        </div>
      )}
    </div>
  );
}