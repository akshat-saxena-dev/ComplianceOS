"""
reporter.py — PDF report generator using ReportLab.
Produces a styled compliance audit report PDF.
"""

import io
from datetime import datetime
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# --- Brand Colors ---
DARK_BG = colors.HexColor("#0F172A")
NEON_GREEN = colors.HexColor("#22C55E")
CRIMSON = colors.HexColor("#EF4444")
ELECTRIC_BLUE = colors.HexColor("#3B82F6")
AMBER = colors.HexColor("#F59E0B")
SLATE_700 = colors.HexColor("#334155")
SLATE_500 = colors.HexColor("#64748B")
SLATE_200 = colors.HexColor("#E2E8F0")
WHITE = colors.white


def _severity_color(severity: str) -> colors.HexColor:
    return {
        "CRITICAL": colors.HexColor("#7C3AED"),
        "HIGH": CRIMSON,
        "MEDIUM": AMBER,
        "LOW": ELECTRIC_BLUE,
    }.get(severity.upper(), SLATE_500)


def _status_color(status: str) -> colors.HexColor:
    return {
        "PASS": NEON_GREEN,
        "FAIL": CRIMSON,
        "SKIPPED": SLATE_500,
    }.get(status.upper(), SLATE_500)


def generate_pdf(audit_data: Dict[str, Any]) -> bytes:
    """
    Generate a PDF from audit_data dict (output of auditor.run_audit).
    Returns raw bytes of the PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    story: List = []

    # ------------------------------------------------------------------ Header
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontSize=22,
        textColor=ELECTRIC_BLUE,
        spaceAfter=2 * mm,
        fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=SLATE_500,
        spaceAfter=6 * mm,
        fontName="Helvetica",
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9,
        textColor=SLATE_700,
        fontName="Helvetica",
        leading=12,
    )
    mono_style = ParagraphStyle(
        "Mono",
        parent=styles["Normal"],
        fontSize=7.5,
        textColor=SLATE_700,
        fontName="Courier",
        leading=10,
        leftIndent=4,
    )

    story.append(Paragraph("Network Compliance Audit Report", title_style))
    story.append(
        Paragraph(
            "Vendor-Agnostic Network Compliance Engine &nbsp;|&nbsp; CIS Benchmark v1.0",
            subtitle_style,
        )
    )
    story.append(HRFlowable(width="100%", thickness=1, color=ELECTRIC_BLUE))
    story.append(Spacer(1, 4 * mm))

    # ---------------------------------------------------------- Device Summary
    summary = audit_data.get("summary", {})
    hostname = audit_data.get("hostname", "Unknown")
    vendor = audit_data.get("vendor", "Unknown").title()
    timestamp_raw = audit_data.get("timestamp", "")
    try:
        ts = datetime.fromisoformat(timestamp_raw).strftime("%Y-%m-%d %H:%M:%S UTC")
    except Exception:
        ts = timestamp_raw

    info_data = [
        ["Device Hostname", hostname, "Vendor", vendor],
        ["Scan Timestamp", ts, "Total Rules", str(summary.get("total", 0))],
        [
            "Passed",
            str(summary.get("passed", 0)),
            "Failed",
            str(summary.get("failed", 0)),
        ],
        ["Skipped", str(summary.get("skipped", 0)), "", ""],
    ]

    info_table = Table(info_data, colWidths=[40 * mm, 55 * mm, 40 * mm, 45 * mm])
    info_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("TEXTCOLOR", (0, 0), (0, -1), SLATE_700),
                ("TEXTCOLOR", (2, 0), (2, -1), SLATE_700),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTNAME", (3, 0), (3, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#F8FAFC"), SLATE_200]),
                ("GRID", (0, 0), (-1, -1), 0.5, SLATE_200),
                ("PADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(info_table)
    story.append(Spacer(1, 6 * mm))

    # ----------------------------------------------------- Compliance Summary Bar
    total = summary.get("total", 1)
    passed = summary.get("passed", 0)
    failed = summary.get("failed", 0)
    skipped = summary.get("skipped", 0)
    score_pct = int((passed / total) * 100) if total > 0 else 0

    score_color = NEON_GREEN if score_pct >= 80 else AMBER if score_pct >= 50 else CRIMSON
    summary_style = ParagraphStyle(
        "SummaryBig",
        parent=styles["Normal"],
        fontSize=28,
        textColor=score_color,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
    )
    story.append(Paragraph(f"Compliance Score: {score_pct}%", summary_style))
    story.append(Spacer(1, 4 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=SLATE_200))
    story.append(Spacer(1, 4 * mm))

    # ----------------------------------------------------------- Results Table
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Normal"],
        fontSize=13,
        textColor=ELECTRIC_BLUE,
        fontName="Helvetica-Bold",
        spaceAfter=3 * mm,
    )
    story.append(Paragraph("Detailed Audit Results", section_style))

    table_header = ["Rule ID", "Rule Name", "Severity", "Expected", "Actual", "Status"]
    table_data = [table_header]

    for res in audit_data.get("results", []):
        row = [
            res.get("rule_id", ""),
            res.get("name", ""),
            res.get("severity", ""),
            str(res.get("expected_value", "")),
            str(res.get("actual_value", "N/A")),
            res.get("status", ""),
        ]
        table_data.append(row)

    results_table = Table(
        table_data,
        colWidths=[20 * mm, 55 * mm, 22 * mm, 20 * mm, 20 * mm, 18 * mm],
    )

    table_styles = [
        ("BACKGROUND", (0, 0), (-1, 0), DARK_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#F1F5F9")]),
        ("GRID", (0, 0), (-1, -1), 0.4, SLATE_200),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]

    for i, res in enumerate(audit_data.get("results", []), start=1):
        status = res.get("status", "")
        sev = res.get("severity", "")
        sc = _status_color(status)
        sevc = _severity_color(sev)
        table_styles.append(("TEXTCOLOR", (5, i), (5, i), sc))
        table_styles.append(("FONTNAME", (5, i), (5, i), "Helvetica-Bold"))
        table_styles.append(("TEXTCOLOR", (2, i), (2, i), sevc))
        table_styles.append(("FONTNAME", (2, i), (2, i), "Helvetica-Bold"))

    results_table.setStyle(TableStyle(table_styles))
    story.append(results_table)
    story.append(Spacer(1, 6 * mm))

    # ------------------------------------------------------- Remediation Section
    failed_results = [r for r in audit_data.get("results", []) if r.get("status") == "FAIL"]
    if failed_results:
        story.append(HRFlowable(width="100%", thickness=0.5, color=SLATE_200))
        story.append(Spacer(1, 3 * mm))
        story.append(Paragraph("Remediation Commands", section_style))

        for res in failed_results:
            rule_label_style = ParagraphStyle(
                "RuleLabel",
                parent=styles["Normal"],
                fontSize=10,
                textColor=CRIMSON,
                fontName="Helvetica-Bold",
                spaceAfter=1 * mm,
                spaceBefore=3 * mm,
            )
            story.append(
                Paragraph(f"[{res['rule_id']}] {res['name']}", rule_label_style)
            )
            remediation_text = res.get("remediation", "No remediation available.")
            for cmd_line in remediation_text.split("\n"):
                story.append(Paragraph(cmd_line, mono_style))
            story.append(Spacer(1, 2 * mm))

    # ------------------------------------------------------------------ Footer
    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=SLATE_200))
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=7,
        textColor=SLATE_500,
        fontName="Helvetica",
        alignment=TA_CENTER,
        spaceBefore=3 * mm,
    )
    story.append(
        Paragraph(
            "Generated by Vendor-Agnostic Network Compliance Engine &nbsp;|&nbsp; "
            "CIS Benchmark Evaluation &nbsp;|&nbsp; CONFIDENTIAL",
            footer_style,
        )
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
