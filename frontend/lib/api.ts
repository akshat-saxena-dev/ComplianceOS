const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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

export interface AuditResponse {
  timestamp: string;
  vendor: string;
  hostname: string;
  filename?: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  results: AuditResult[];
  unrecognized: string[];
}

export interface StatsResponse {
  total_devices: number;
  compliant: number;
  action_required: number;
  last_scan: string | null;

  compliance_by_vendor: Record<
    string,
    {
      total: number;
      compliant: number;
    }
  >;

  compliance_by_rule: Record<
    string,
    {
      name: string;
      pass: number;
      fail: number;
      skipped: number;
    }
  >;

  avg_scan_time_ms: number | null;
}

export interface HistoryEntry {
  id: number;
  timestamp: string;
  filename: string;
  vendor: string;
  hostname: string;

  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };

  results?: AuditResult[];
}

export interface UnrecognizedResponse {
  vendor: string;
  unrecognized: string[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail ?? message;
    } catch {
      // use status message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
/**
 * Upload a config file and run the audit (JSON payload).
 */
export async function uploadConfig(
  file: File,
  vendor: string
): Promise<AuditResponse> {
  // Read the file as raw text directly in the browser
  const textContent = await file.text();

  // Send it as a clean JSON object instead of FormData
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: file.name,
      content: textContent,
      vendor: vendor,
    }),
  });
  
  return handleResponse<AuditResponse>(res);
}

/**
 * Get last audit result (without re-uploading).
 */
export async function getLastAudit(): Promise<AuditResponse> {
  const res = await fetch(`${API_BASE}/api/audit`, { method: "POST" });
  return handleResponse<AuditResponse>(res);
}

/**
 * Get dashboard statistics.
 */
export async function getStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_BASE}/api/stats`);
  return handleResponse<StatsResponse>(res);
}

/**
 * Get unrecognized commands for the Training Hub.
 */
export async function getUnrecognized(): Promise<UnrecognizedResponse> {
  const res = await fetch(`${API_BASE}/api/train/unrecognized`);
  return handleResponse<UnrecognizedResponse>(res);
}

/**
 * Save a new command mapping to the knowledge base.
 */
export async function trainMapping(payload: {
  vendor: string;
  raw_command: string;
  mapped_key: string;
  mapped_value: boolean | string;
}): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/**
 * Get audit history list.
 */
export async function getHistory(): Promise<{ history: HistoryEntry[] }> {
  const res = await fetch(`${API_BASE}/api/history`);
  return handleResponse(res);
}

/**
 * Trigger PDF download of the last audit.
 */
export function downloadReport(): void {
  window.open(`${API_BASE}/api/report/download`, "_blank");
}
