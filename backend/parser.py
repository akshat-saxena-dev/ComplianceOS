"""
parser.py — Regex-based config file parser.

Maps raw device configuration lines to a standardized JSON structure
using vendor-specific patterns from mappings.json.

No LLM is used. Parsing is deterministic.
"""

import re
import json
import os
from typing import Dict, Any, List


DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MAPPINGS_FILE = os.path.join(DATA_DIR, "mappings.json")


def load_mappings() -> Dict[str, Any]:
    """Load vendor-specific mappings from mappings.json."""
    with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def detect_vendor(config_text: str) -> str:
    """
    Detect the most likely vendor from configuration syntax.

    Returns:
        'cisco', 'juniper', 'palo_alto', or 'unknown'
    """

    text_lower = config_text.lower()

    juniper_signals = [
        "set system host-name",
        "set system services",
        "delete system",
        "set interfaces",
        "set routing-options",
    ]

    palo_alto_signals = [
        "set deviceconfig",
        "set network interface ethernet",
        "set vsys vsys1",
    ]

    cisco_signals = [
        "ip http server",
        "no ip http",
        "line vty",
        "transport input",
        "hostname ",
    ]

    juniper_score = sum(
        1
        for signal in juniper_signals
        if signal.lower() in text_lower
    )

    palo_alto_score = sum(
        1
        for signal in palo_alto_signals
        if signal.lower() in text_lower
    )

    cisco_score = sum(
        1
        for signal in cisco_signals
        if re.search(signal, text_lower, re.MULTILINE)
    )

    scores = {
        "cisco": cisco_score,
        "juniper": juniper_score,
        "palo_alto": palo_alto_score,
    }

    best_vendor = max(scores, key=scores.get)
    best_score = scores[best_vendor]

    # No vendor-specific signals detected.
    if best_score == 0:
        return "unknown"

    return best_vendor

def pattern_matches(pattern: str, line: str) -> bool:
    """
    Match a mapping pattern against a configuration line.

    First attempts a literal match, which is safer for ordinary command
    patterns. If that fails, attempts regex matching for patterns such as:

        snmp-server group .* v3 priv
    """

    literal_match = re.search(
        re.escape(pattern),
        line,
        re.IGNORECASE,
    )

    if literal_match:
        return True

    try:
        return re.search(
            pattern,
            line,
            re.IGNORECASE,
        ) is not None
    except re.error:
        return False


def extract_value(pattern: str, line: str) -> str:
    """
    Extract the text remaining after an extraction pattern.

    Example:
        pattern = "hostname"
        line = "hostname core-router-01"

    Returns:
        "core-router-01"
    """

    try:
        remainder = re.sub(
            re.escape(pattern),
            "",
            line,
            count=1,
            flags=re.IGNORECASE,
        ).strip()

        if remainder:
            return remainder

    except re.error:
        pass

    return line.strip()


def parse_config(
    config_text: str,
    vendor: str = "auto",
) -> Dict[str, Any]:
    """
    Parse raw configuration text into a standardized result.

    Returns:
        {
            "vendor": str,
            "parsed": {
                "hostname": str,
                "http_enabled": bool,
                "ssh_enabled": bool,
                "telnet_enabled": bool,
                "ssh_only": bool,
                "ntp_enabled": bool,
                "logging_enabled": bool,
                "snmp_community_present": bool,
                "snmpv3_enabled": bool,
                "snmpv3_secure": bool,
                "snmpv3_only": bool | None
            },
            "unrecognized": [str, ...]
        }
    """

    mappings = load_mappings()

    if vendor == "auto":
        vendor = detect_vendor(config_text)

    if vendor not in mappings:
        vendor_maps = {}
    else:
        vendor_maps = mappings.get(vendor, {})

    parsed: Dict[str, Any] = {}
    unrecognized: List[str] = []

    for raw_line in config_text.splitlines():
        line = raw_line.strip()

        # Ignore empty lines and common comment lines.
        if not line or line.startswith("!") or line.startswith("#"):
            continue

        matched = False

        for pattern, mapping in vendor_maps.items():
            if pattern.startswith("_"):
                continue

            if not pattern_matches(pattern, line):
                continue

            key = mapping["key"]
            raw_value = mapping["value"]

            if raw_value == "__extract__":
                parsed[key] = extract_value(pattern, line)
            else:
                # Last matching configuration command wins.
                parsed[key] = raw_value

            matched = True
            break

        if not matched:
            unrecognized.append(line)

    # Derive SSH-only compliance.
    # Missing SSH or Telnet information is not automatically considered
    # compliant.
    if "ssh_enabled" in parsed or "telnet_enabled" in parsed:
        parsed["ssh_only"] = (
            parsed.get("ssh_enabled", False)
            and not parsed.get("telnet_enabled", False)
        )

    # Derive SNMPv3-only compliance only when at least one SNMP-related
    # setting was detected.
    snmp_keys = {
        "snmp_community_present",
        "snmpv3_enabled",
        "snmpv3_secure",
    }

    if any(key in parsed for key in snmp_keys):
        parsed["snmpv3_only"] = (
            not parsed.get("snmp_community_present", False)
            and parsed.get("snmpv3_enabled", False)
            and parsed.get("snmpv3_secure", False)
        )
    else:
        # None means SNMP configuration was not detected.
        parsed["snmpv3_only"] = None

    return {
        "vendor": vendor,
        "parsed": parsed,
        "unrecognized": unrecognized,
    }