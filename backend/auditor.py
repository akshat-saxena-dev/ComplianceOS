# auditor.py

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

BASE_DIR = Path(__file__).resolve().parent
BENCHMARK_PATH = BASE_DIR / "benchmark.json"


def load_benchmark() -> List[Dict[str, Any]]:
    """
    Load benchmark rules from benchmark.json.
    """
    with open(BENCHMARK_PATH, "r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("benchmark.json must contain a list of rules")

    return data


def get_remediation(
    rule: Dict[str, Any],
    vendor: str
) -> str:
    """
    Return vendor-specific remediation instructions.
    """
    remediation = rule.get("remediation", {})

    if not isinstance(remediation, dict):
        return ""

    return (
        remediation.get(vendor)
        or remediation.get(vendor.lower())
        or ""
    )


def audit_config(
    parsed_config: Dict[str, Any],
    vendor: str
) -> Dict[str, Any]:
    """
    Compare parsed configuration against every benchmark rule.
    """

    benchmark = load_benchmark()

    results: List[Dict[str, Any]] = []

    passed = 0
    failed = 0
    skipped = 0

    for rule in benchmark:

        # IMPORTANT:
        # benchmark.json uses rule_id and expected_value
        rule_id = rule.get("rule_id", "")
        name = rule.get("name", "")
        description = rule.get("description", "")
        severity = rule.get("severity", "MEDIUM")

        parameter = rule.get("parameter")
        expected_value = rule.get("expected_value")

        # Get parsed value
        actual_value = parsed_config.get(parameter)

        # Parameter missing / unknown
        if parameter not in parsed_config or actual_value is None:

            status = "NOT_CONFIGURED"
            actual_value = None

            skipped += 1

        # Correct configuration
        elif actual_value == expected_value:

            status = "PASS"

            passed += 1

        # Incorrect configuration
        else:

            status = "FAIL"

            failed += 1

        results.append(
            {
                "rule_id": rule_id,
                "name": name,
                "description": description,
                "status": status,
                "severity": severity,
                "parameter": parameter,
                "actual_value": actual_value,
                "expected_value": expected_value,
                "remediation": get_remediation(rule, vendor),
            }
        )

    total = len(results)

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "vendor": vendor,
        "hostname": parsed_config.get("hostname", "Unknown"),

        "results": results,

        "summary": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
        },
    }


def run_audit(
    parsed_config: Dict[str, Any],
    vendor: str
) -> Dict[str, Any]:
    """
    Compatibility wrapper used by main.py.
    """
    return audit_config(parsed_config, vendor)