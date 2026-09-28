"""
main.py — FastAPI application entry point.
Exposes 4 REST endpoints consumed by the Next.js frontend.
"""

import os
import google.generativeai as genai
from pydantic import BaseModel
import json
import time

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from auditor import run_audit
from parser import parse_config
from reporter import generate_pdf

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DATABASE_FILE = os.path.join(DATA_DIR, "database.json")
MAPPINGS_FILE = os.path.join(DATA_DIR, "mappings.json")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def read_db() -> Dict:
    with open(DATABASE_FILE, "r") as f:
        return json.load(f)


def write_db(data: Dict) -> None:
    with open(DATABASE_FILE, "w") as f:
        json.dump(data, f, indent=2, default=str)


def read_mappings() -> Dict:
    with open(MAPPINGS_FILE, "r") as f:
        return json.load(f)


def write_mappings(data: Dict) -> None:
    with open(MAPPINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Network Compliance Engine API",
    description="Vendor-Agnostic CIS Benchmark Compliance Auditor",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Open for hackathon prototype — restrict in production
    allow_credentials=False,      # Must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------
class TrainPayload(BaseModel):
    vendor: str
    raw_command: str
    mapped_key: str
    mapped_value: Any  # bool | str | int


class UploadPayload(BaseModel):
    filename: str
    content: str
    vendor: str = "auto"

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "ok", "service": "Network Compliance Engine API v1.0"}

@app.get("/api/stats")
def get_stats():
    """
    Calculate dashboard statistics from the latest audit for each device.

    A device is identified by hostname.

    Returns:
    - total_devices: number of unique devices
    - compliant: unique devices whose latest audit has 0 failures
    - action_required: unique devices whose latest audit has >= 1 failure
    - last_scan: timestamp of the most recent audit
    - compliance_by_vendor: current compliance grouped by vendor
    - compliance_by_rule: current CIS rule status across latest audits
    """

    db = read_db()

    history = db.get("audit_history", []) or []

    # ------------------------------------------------------------------
    # No audit history
    # ------------------------------------------------------------------
    if not history:
        return {
            "total_devices": 0,
            "compliant": 0,
            "action_required": 0,
            "last_scan": None,
            "compliance_by_vendor": {},
            "compliance_by_rule": {},
        }

    # ------------------------------------------------------------------
    # Find the latest audit for each unique device
    # ------------------------------------------------------------------
    latest_by_device: Dict[str, Dict[str, Any]] = {}

    for entry in history:
        hostname = entry.get("hostname", "Unknown")
        timestamp = entry.get("timestamp")

        if not timestamp:
            continue

        existing = latest_by_device.get(hostname)

        if existing is None:
            latest_by_device[hostname] = entry
        else:
            existing_timestamp = existing.get("timestamp")

            if (
                not existing_timestamp
                or timestamp > existing_timestamp
            ):
                latest_by_device[hostname] = entry

    # ------------------------------------------------------------------
    # Overall device statistics
    # ------------------------------------------------------------------
    total_devices = len(latest_by_device)

    compliant = 0
    action_required = 0

    for entry in latest_by_device.values():
        summary = entry.get("summary", {}) or {}
        failed = summary.get("failed", 0)

        if failed == 0:
            compliant += 1
        else:
            action_required += 1

    # ------------------------------------------------------------------
    # Most recent scan
    # ------------------------------------------------------------------
    timestamps = [
        entry.get("timestamp")
        for entry in history
        if entry.get("timestamp")
    ]

    last_scan = max(timestamps) if timestamps else None

    # ------------------------------------------------------------------
    # Compliance by vendor
    # ------------------------------------------------------------------
    vendor_totals: Dict[str, int] = {}
    vendor_compliant: Dict[str, int] = {}

    for entry in latest_by_device.values():
        vendor = str(
            entry.get("vendor", "unknown")
        ).lower()

        vendor_totals[vendor] = (
            vendor_totals.get(vendor, 0) + 1
        )

        vendor_compliant.setdefault(vendor, 0)

        summary = entry.get("summary", {}) or {}
        failed = summary.get("failed", 0)

        if failed == 0:
            vendor_compliant[vendor] += 1

    compliance_by_vendor = {
        vendor: {
            "total": vendor_totals[vendor],
            "compliant": vendor_compliant.get(vendor, 0),
        }
        for vendor in vendor_totals
    }

    # ------------------------------------------------------------------
    # CIS rule compliance
    #
    # Only newer history entries contain "results".
    # Older seed/history entries without rule-level results are ignored.
    # ------------------------------------------------------------------
    rule_stats: Dict[str, Dict[str, Any]] = {}

    for entry in latest_by_device.values():
        results = entry.get("results")

        if not results:
            continue

        for result in results:
            rule_id = result.get("rule_id")
            rule_name = result.get("name", "")
            status = result.get("status")

            if not rule_id:
                continue

            if rule_id not in rule_stats:
                rule_stats[rule_id] = {
                    "name": rule_name,
                    "pass": 0,
                    "fail": 0,
                    "skipped": 0,
                }

            if status == "PASS":
                rule_stats[rule_id]["pass"] += 1

            elif status == "FAIL":
                rule_stats[rule_id]["fail"] += 1

            elif status in (
                "SKIPPED",
                "NOT_CONFIGURED",
            ):
                rule_stats[rule_id]["skipped"] += 1


    # ------------------------------------------------------------------
    # Average scan time
    # ------------------------------------------------------------------
    scan_durations = [
        entry.get("scan_duration_ms")
        for entry in history
        if isinstance(entry.get("scan_duration_ms"), (int, float))
    ]

    avg_scan_time_ms = (
        round(sum(scan_durations) / len(scan_durations), 2)
        if scan_durations
        else None
    )
    
    # ------------------------------------------------------------------
    # Final response
    # ------------------------------------------------------------------
    return {
        "total_devices": total_devices,
        "compliant": compliant,
        "action_required": action_required,
        "last_scan": last_scan,
        "compliance_by_vendor": compliance_by_vendor,
        "compliance_by_rule": rule_stats,
        "avg_scan_time_ms": avg_scan_time_ms,
    }

@app.post("/api/upload")
async def upload_config(payload: UploadPayload):
    """
    Receive config file as JSON, parse it, run audit, persist results.
    Returns full audit result JSON.
    """
    if not payload.filename.endswith((".txt", ".conf", ".cfg", ".log")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a .txt, .conf, or .cfg file.",
        )

    # We already have the text from the JSON payload!
    raw_text = payload.content

    # Start scan timer
    scan_start = time.perf_counter()

    # 1. Parse
    parse_result = parse_config(raw_text, vendor=payload.vendor)

    # 2. Audit
    audit_result = run_audit(
        parse_result["parsed"],
        parse_result["vendor"]
    )

    # Stop scan timer
    scan_duration_ms = round(
        (time.perf_counter() - scan_start) * 1000,
        2
    )

    audit_result["filename"] = payload.filename
    audit_result["unrecognized"] = parse_result["unrecognized"]
    audit_result["scan_duration_ms"] = scan_duration_ms

    # 3. Persist to database.json
    db = read_db()
    db["last_audit"] = audit_result

    # Update running stats
    db["stats"]["last_scan"] = audit_result["timestamp"]
    
    # Track unrecognized commands globally (deduplicate)
    existing_unrecognized = set(db.get("unrecognized_commands", []))
    for cmd in parse_result["unrecognized"]:
        existing_unrecognized.add(cmd)
    db["unrecognized_commands"] = list(existing_unrecognized)

    history = db.get("audit_history", [])

    existing_ids = [
        entry.get("id", 0)
        for entry in history
        if isinstance(entry.get("id"), int)
    ]

    next_id = max(existing_ids, default=0) + 1

    history_entry = {
        "id": next_id,
        "timestamp": audit_result["timestamp"],
        "filename": payload.filename,
        "vendor": audit_result["vendor"],
        "hostname": audit_result["hostname"],
        "summary": audit_result["summary"],
        "results": audit_result["results"],
        "scan_duration_ms": scan_duration_ms,
    }

    history.append(history_entry)
    db["audit_history"] = history[-20:]

    write_db(db)

    return audit_result


# Configure Gemini using your API Key
# Make sure to replace "YOUR_API_KEY_HERE" with your actual key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Define a Pydantic model for the incoming request
class SuggestionRequest(BaseModel):
    command: str

@app.post("/api/suggest-mapping")
async def suggest_mapping(request: SuggestionRequest):
    """
    Takes an unrecognized command and asks Gemini for a mapping suggestion.
    Fails gracefully if tokens run out or the network drops.
    """
    raw_command = request.command
    
    try:
        # Using the flash model for the absolute lowest latency
        model = genai.GenerativeModel("gemini-1.5-flash") 
        
        # We give the AI a very strict prompt so it only returns the exact key we need
        prompt = f"""
        You are a deterministic network security parser. 
        I have an unrecognized configuration command: "{raw_command}"
        Which CIS Benchmark parameter does this most likely map to?
        Choose ONLY ONE from this exact list: http_enabled, ssh_only, ntp_enabled, logging_enabled, snmpv3_only.
        Respond with just the parameter name, nothing else. If it does not match any, respond with 'unknown'.
        """
        
        response = model.generate_content(prompt)
        suggestion = response.text.strip().lower()
        
        # Final validation to ensure the AI didn't hallucinate a fake parameter
        valid_parameters = ["http_enabled", "ssh_only", "ntp_enabled", "logging_enabled", "snmpv3_only"]
        if suggestion not in valid_parameters:
            suggestion = None
            
        return {"suggestion": suggestion, "status": "success"}

    except Exception as e:
        # GRACEFUL DEGRADATION: If anything goes wrong, return None instead of crashing
        print(f"AI Suggestion Engine Offline: {e}")
        return {"suggestion": None, "status": "degraded"}


@app.post("/api/audit")
def re_audit():
    """
    Re-run audit on the last stored parse result.
    Useful for refreshing after training updates.
    """
    db = read_db()
    last = db.get("last_audit")
    if not last:
        raise HTTPException(status_code=404, detail="No previous audit found. Please upload a config first.")
    return last


@app.post("/api/train")
def train(payload: TrainPayload):
    """
    Save a new command → key/value mapping to mappings.json.
    The value is coerced: 'true'/'false' strings become booleans.
    """
    vendor = payload.vendor.lower().strip()
    raw_cmd = payload.raw_command.strip()
    key = payload.mapped_key.strip()

    if vendor not in {"cisco", "juniper", "palo_alto", "unknown"}:
        vendor = "unknown"

    # Coerce value type
    val = payload.mapped_value
    if isinstance(val, str):
        if val.lower() == "true":
            val = True
        elif val.lower() == "false":
            val = False

    mappings = read_mappings()

    if vendor not in mappings:
        mappings[vendor] = {}

    mappings[vendor][raw_cmd] = {"key": key, "value": val}
    write_mappings(mappings)

    # Remove from unrecognized list in database
    db = read_db()
    unrecognized = db.get("unrecognized_commands", [])
    if raw_cmd in unrecognized:
        unrecognized.remove(raw_cmd)
        db["unrecognized_commands"] = unrecognized
        write_db(db)

    return {
        "status": "success",
        "message": f"Mapping saved: '{raw_cmd}' -> {key}={val} (vendor: {vendor})",
    }


@app.get("/api/train/unrecognized")
def get_unrecognized():
    """Return list of unrecognized commands flagged during last parse."""
    db = read_db()
    last = db.get("last_audit") or {}
    vendor = last.get("vendor", "unknown") if isinstance(last, dict) else "unknown"
    commands = db.get("unrecognized_commands", []) or []
    return {"vendor": vendor, "unrecognized": commands}


@app.get("/api/history")
def get_history():
    """Return audit history list."""
    db = read_db()
    return {"history": db.get("audit_history", [])}


@app.get("/api/report/download")
def download_report():
    """
    Generate and return a PDF of the last audit result.
    """
    db = read_db()
    last_audit = db.get("last_audit")
    if not last_audit:
        raise HTTPException(
            status_code=404,
            detail="No audit result found. Please upload and audit a config file first.",
        )

    pdf_bytes = generate_pdf(last_audit)

    hostname = last_audit.get("hostname", "device").replace(" ", "_")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"compliance_report_{hostname}_{timestamp}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
