"""
ArgusASM Submission PDF Generator
Compiles the 7-section submission dossier into publication-grade Proposed-structure-hackathon.pdf
AIORI Hackathon 2026 - Problem Statement PS-011
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (Pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 11 * 72 - 36, "AIORI HACKATHON 2026 // PS-011: ARGUS-ASM TECHNICAL DOSSIER")
            self.drawRightString(8.5 * 72 - 54, 11 * 72 - 36, "LEVEL 2 SUBMISSION FREEZE")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * 72 - 40, 8.5 * 72 - 54, 11 * 72 - 40)

        # Footer (All pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 46, 8.5 * 72 - 54, 46)
        self.drawString(54, 34, "ArgusASM: Autonomous Attack-Surface Inventory & Cryptographic Drift Sentinel")
        self.drawRightString(8.5 * 72 - 54, 34, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def build_pdf(filename="Proposed-structure-hackathon.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0284c7"),
        spaceAfter=14,
    )
    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True,
    )
    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#0369a1"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6,
    )
    bullet_style = ParagraphStyle(
        "BulletText",
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3,
    )
    code_style = ParagraphStyle(
        "CodeBlock",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f8fafc"),
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6,
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#1e293b"),
    )
    table_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#ffffff"),
    )

    story = []

    # Title & Metadata Banner
    story.append(Paragraph("AIORI HACKATHON 2026 // PROBLEM STATEMENT PS-011", subtitle_style))
    story.append(Paragraph("ArgusASM: Autonomous Attack-Surface Inventory &amp; Drift Sentinel", title_style))
    story.append(Paragraph("Level 2 Technical Submission Dossier &amp; Architecture Specification", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=10))

    meta_text = """
    <b>Track:</b> Cybersecurity &amp; Infrastructure Resilience &nbsp;|&nbsp; <b>Team:</b> ZeroDayZ &nbsp;|&nbsp; <b>Repo:</b> aiori-hackathon/A3-PS011-TC116<br/>
    <b>Authorization Ref:</b> AIORI-2026-PS011-AUTH-001 &nbsp;|&nbsp; <b>Evaluation Window:</b> 16 Oct - 30 Oct 2026 &nbsp;|&nbsp; <b>Version:</b> 1.0 (Submission Freeze)
    """
    story.append(Paragraph(meta_text, body_style))
    story.append(Spacer(1, 8))

    # Executive Deliverables Table
    story.append(Paragraph("Official Submission Deliverables &amp; Verification Matrix", h2_style))
    deliverables_data = [
        [
            Paragraph("Deliverable", table_header),
            Paragraph("Live Link / Location", table_header),
            Paragraph("Verification Scope &amp; Purpose", table_header),
        ],
        [
            Paragraph("<b>Live Working Demo</b>", table_cell),
            Paragraph("https://a3-ps-011-tc-116.vercel.app", table_cell),
            Paragraph("Production Sentinel Web Console (Interactive HUD, topology graph, drift viewer, Dark/Light mode)", table_cell),
        ],
        [
            Paragraph("<b>Walkthrough Video</b>", table_cell),
            Paragraph("https://youtu.be/rFjD-Qt4ju8?si=UlPgNCL80PGyVgLd", table_cell),
            Paragraph("Complete video demonstration covering perimeter discovery, drift injection, and verification", table_cell),
        ],
        [
            Paragraph("<b>Presentation Deck</b>", table_cell),
            Paragraph("Google Slides Presentation", table_cell),
            Paragraph("High-level architecture, threat modeling, and defensive engineering approach", table_cell),
        ],
        [
            Paragraph("<b>Live Backend API</b>", table_cell),
            Paragraph("https://argus-backend-api-sqrs.onrender.com", table_cell),
            Paragraph("FastAPI REST API, Swagger UI (/docs), and live telemetry (/api/telemetry/live)", table_cell),
        ],
        [
            Paragraph("<b>Executive Audit Report</b>", table_cell),
            Paragraph(".../api/v1/export/executive-report", table_cell),
            Paragraph("Print-ready executive perimeter report with cryptographic Merkle attestation", table_cell),
        ],
        [
            Paragraph("<b>OASIS SARIF 2.1.0</b>", table_cell),
            Paragraph(".../api/v1/export/sarif", table_cell),
            Paragraph("OASIS standard security format for GitHub Advanced Security and enterprise SIEMs", table_cell),
        ],
        [
            Paragraph("<b>Automated Pytest Suite</b>", table_cell),
            Paragraph("tests/ (51/51 tests passing)", table_cell),
            Paragraph("100% pass rate in 1.1s covering scope caps, 0-packet ledger, Merkle chain, wording lint", table_cell),
        ],
        [
            Paragraph("<b>Offline Deliverable Pack</b>", table_cell),
            Paragraph("samples/", table_cell),
            Paragraph("Snapshots (T0/T1/T2), drift reports, SARIF, CSV, JSON, and HTML executive audit report", table_cell),
        ],
    ]
    t_deliv = Table(deliverables_data, colWidths=[120, 160, 224])
    t_deliv.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(t_deliv)
    story.append(Spacer(1, 10))

    # SECTION 1
    story.append(Paragraph("Section 1: Title, Abstract, Authorized Scope Definition &amp; Authorization Statement", h1_style))
    story.append(Paragraph("<b>1.1 Executive Abstract:</b> Modern hybrid cloud architectures frequently suffer from asset accumulation debt: unmaintained test subdomains, expired X.509 TLS certificates, exposed debug ports, and orphaned CNAME records pointing to decommissioned third-party cloud buckets. <b>ArgusASM</b> is an autonomous, strictly non-intrusive external attack surface management (ASM) platform designed specifically for the AIORI 2026 PS-011 mandate. Operating under hard cryptographic guardrails, ArgusASM continuously discovers, inventories, and audits an authorized portfolio of public domains and hosts, establishing a tamper-evident baseline snapshot anchored in a SHA-256 Merkle tree. When perimeter drift occurs, ArgusASM triggers immediate multi-channel alerts, computes stateful set-difference deltas, applies CVSS-calibrated hygiene score deductions, and stages non-destructive remediation advisories behind a mandatory Human-in-the-Loop (HITL) governance gate.", body_style))

    story.append(Paragraph("<b>1.2 Authorized Scope Boundary:</b> Enforces an un-bypassable boundary cap of maximum 20 public domains and maximum 10 public hosts. Probing beyond these limits is blocked at the pre-flight parser level with zero network packets dispatched.", body_style))
    story.append(Paragraph("&bull; <b>Primary Zone:</b> aiori.lab (Authoritative CoreDNS Lab Zone)", bullet_style))
    story.append(Paragraph("&bull; <b>Approved Domain Cap:</b> 20 (Active portfolio: 15 domains)", bullet_style))
    story.append(Paragraph("&bull; <b>Approved Host Cap:</b> 10 (Active portfolio: 8 hosts)", bullet_style))
    story.append(Paragraph("&bull; <b>Permitted Port Whitelist:</b> Strictly restricted to {22, 53, 80, 443, 8080}", bullet_style))

    story.append(Paragraph("<b>1.3 Formal Authorization Statement:</b> <i>'This document certifies that ArgusASM is authorized by AIORI Infrastructure &amp; Security Operations to perform passive, read-only reconnaissance against the lab assets cataloged in approved_scope.json between 2026-10-01T00:00:00Z and 2026-11-30T23:59:59Z. Active exploitation, credential brute-forcing, denial-of-service, third-party cloud bucket claiming, and out-of-scope targeting are strictly prohibited.'</i>", body_style))
    story.append(Spacer(1, 8))

    # SECTION 2
    story.append(Paragraph("Section 2: Architecture and the Four Documented Checks", h1_style))
    story.append(Paragraph("ArgusASM decouples discovery, state tracking, and user visualization into clean asynchronous micro-modules:", body_style))
    story.append(Paragraph("&bull; <b>Check 1 (Public DNS Inventory):</b> Resolves RFC 1035/2181 A, AAAA, CNAME, MX, TXT, and NS records with 3.0s socket timeouts. Traverses CNAME chains to a maximum depth of 3 hops. Read-only; zone transfers (AXFR) are prohibited.", bullet_style))
    story.append(Paragraph("&bull; <b>Check 2 (Extended TLS Inspector):</b> Validates X.509 certificates (RFC 5280). Identifies expired certificates, near-term expirations (&lt;14 days), self-signed certificates, weak RSA keys (&lt;2048-bit), and deprecated protocols (TLS 1.0/1.1). Non-intrusive handshake only.", bullet_style))
    story.append(Paragraph("&bull; <b>Check 3 (Permitted Service Auditor):</b> Connects strictly to whitelisted ports {22, 53, 80, 443, 8080}. Non-intrusively captures service banners without fuzzing. Detects unapproved shadow services (such as Werkzeug debug on port 8080).", bullet_style))
    story.append(Paragraph("&bull; <b>Check 4 (Potential Dangling DNS Detector):</b> Analyzes CNAME targets against cloud provider patterns (AWS S3, Azure Web Apps, GitHub Pages). Flags unallocated buckets via HTTP 404 NoSuchBucket fingerprints. <b>Strict non-exploitation guarantee: Never attempts to claim or register orphaned resources.</b>", bullet_style))
    story.append(Spacer(1, 8))

    # SECTION 3
    story.append(Paragraph("Section 3: Non-Exploitation Policy and Safety Guardrails", h1_style))
    story.append(Paragraph("ArgusASM guarantees that defensive monitoring never introduces operational risk. Out-of-scope targets are rejected at pre-flight with strictly zero network calls, logged into SQLite by <code>RequestLedger</code>:", body_style))

    ledger_code = """[
  {
    "id": "REQ-7B8A91C2D4E0", "timestamp": "2026-10-25T13:21:40.104Z",
    "target": "external-attacker.com", "probe_type": "DNS",
    "status": "ScopeViolation", "network_calls_made": 0, "duration_ms": 0.1,
    "response_summary": "BLOCKED BY SCOPE GUARDRAIL: Target not in approved scope.",
    "authorization_ref": "AIORI-2026-PS011-AUTH-001"
  }
]"""
    story.append(Paragraph(ledger_code, code_style))
    story.append(Paragraph("<b>Emergency Kill Switch ($R_7$):</b> Invoking <code>POST /api/v1/killswitch</code> halts all in-flight probing threads within &lt;10ms. <br/><b>Human-in-the-Loop (HITL) Gate:</b> All High and Critical findings require explicit human sign-off before any remediation script or firewall change can be dispatched.", body_style))
    story.append(Spacer(1, 8))

    # SECTION 4
    story.append(Paragraph("Section 4: Stateful Change Detection, Snapshot Schema &amp; Merkle Chain", h1_style))
    story.append(Paragraph("Perimeter state is captured as versioned JSON snapshots (<code>snapshots/T0.json</code>, <code>T1.json</code>, <code>T2.json</code>). Each snapshot cryptographically embeds <code>scope_sha256</code> (the SHA-256 hash of approved_scope.json) and a 32-byte SHA-256 Merkle root computed across all canonicalized asset records.", body_style))
    story.append(Paragraph("<b>Merkle Hash Chain Linking:</b> <code>MerkleRoot_n = SHA256(Leaves_n || MerkleRoot_{n-1})</code>. This mathematically guarantees that historical observations cannot be mutated retroactively without breaking the cryptographic chain.", body_style))
    story.append(Paragraph("<b>Stateful Drift Delta Algorithm:</b> <code>Delta = Current \\ Baseline</code>. Categorizes 10 typed drift events: NEW_SERVICE, REMOVED_SERVICE, EXPIRED_CERT, CERT_EXPIRING, CERT_RESOLVED, DNS_RECORD_CHANGED, DANGLING_DNS_CANDIDATE, DANGLING_DNS_RESOLVED, ASSET_ADDED, ASSET_REMOVED. Employs a 2-observation confirmation rule to filter transient network jitter.", body_style))
    story.append(Spacer(1, 8))

    # SECTION 5
    story.append(Paragraph("Section 5: Seeded-Issue Detection Results &amp; Precision/Recall Metrics", h1_style))
    story.append(Paragraph("Evaluated against the multi-container lab testbed simulating the 3 seeded faults:", body_style))

    seeds_table_data = [
        [
            Paragraph("Seed ID", table_header),
            Paragraph("Target Asset", table_header),
            Paragraph("Seeded Fault", table_header),
            Paragraph("Expected Detection", table_header),
            Paragraph("Observed Detection", table_header),
            Paragraph("Score Impact", table_header),
        ],
        [
            Paragraph("<b>TEST-SEED-01</b>", table_cell),
            Paragraph("legacy.aiori.lab:443", table_cell),
            Paragraph("Expired TLS Certificate", table_cell),
            Paragraph("EXPIRED_CERT", table_cell),
            Paragraph("<b>DETECTED (100%)</b>", table_cell),
            Paragraph("-35 points", table_cell),
        ],
        [
            Paragraph("<b>TEST-SEED-02</b>", table_cell),
            Paragraph("dev-edge.aiori.lab:8080", table_cell),
            Paragraph("Unauthorized Port 8080", table_cell),
            Paragraph("NEW_SERVICE", table_cell),
            Paragraph("<b>DETECTED (100%)</b>", table_cell),
            Paragraph("-25 points", table_cell),
        ],
        [
            Paragraph("<b>TEST-SEED-03</b>", table_cell),
            Paragraph("test-s3.aiori.lab", table_cell),
            Paragraph("Orphaned S3 CNAME", table_cell),
            Paragraph("DANGLING_DNS", table_cell),
            Paragraph("<b>DETECTED (100%)</b>", table_cell),
            Paragraph("-30 points", table_cell),
        ],
        [
            Paragraph("<b>Control Host A</b>", table_cell),
            Paragraph("api.aiori.lab:443", table_cell),
            Paragraph("Healthy Production Host", table_cell),
            Paragraph("Clean Posture", table_cell),
            Paragraph("<b>0 False Positives</b>", table_cell),
            Paragraph("0 deductions", table_cell),
        ],
    ]
    t_seeds = Table(seeds_table_data, colWidths=[70, 95, 105, 80, 95, 59])
    t_seeds.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(t_seeds)
    story.append(Spacer(1, 6))

    metrics_text = """
    <b>Empirical Accuracy:</b> Recall = 100.0% (3/3 seeded faults detected) &nbsp;|&nbsp; Precision = 100.0% (0 false positives on Control Host A)<br/>
    <b>Out-of-Scope Enforcement:</b> 100.0% blocked with strictly 0 network calls &nbsp;|&nbsp; <b>HITL Governance:</b> 100.0% staged for operator review.
    """
    story.append(Paragraph(metrics_text, body_style))
    story.append(Spacer(1, 8))

    # SECTION 6
    story.append(Paragraph("Section 6: False-Positive Analysis and Confidence Calibration", h1_style))
    story.append(Paragraph("To prevent alert fatigue and score distortion, ArgusASM applies calibrated mitigation heuristics:", body_style))
    story.append(Paragraph("&bull; <b>Wildcard DNS Zones:</b> Resolves random UUID subdomain. If active, domain is flagged WILDCARD_ACTIVE and generic DNS alerts are down-weighted to LOW confidence.", bullet_style))
    story.append(Paragraph("&bull; <b>CDN / Reverse Proxy Detection:</b> Identifies Cloudflare/Akamai/Fastly headers (Server/Via) and suppresses false port alerts.", bullet_style))
    story.append(Paragraph("&bull; <b>Staging Self-Signed Handling:</b> Uses host role in approved_scope.json; downgrades staging self-signed certs to INFO.", bullet_style))
    story.append(Paragraph("&bull; <b>Generic 404 vs Provider Error:</b> Requires provider-specific signature (&lt;Code&gt;NoSuchBucket&lt;/Code&gt;); generic 404s receive LOW confidence.", bullet_style))
    story.append(Paragraph("&bull; <b>Score Deduction Caps ($R_3$):</b> Expired TLS capped at -40 pts, open ports capped at -35 pts, dangling DNS capped at -40 pts. Hygiene Score: Baseline T0 = 96/100, Drifted T1 = 68/100, Remediated T2 = 96/100.", bullet_style))
    story.append(Spacer(1, 8))

    # SECTION 7
    story.append(Paragraph("Section 7: Conclusion, Operational Impact, Limitations &amp; Regional Roadmap", h1_style))
    story.append(Paragraph("<b>7.1 Operational Impact:</b> ArgusASM transforms attack surface inventory from an ad-hoc scanning exercise into a continuous, deterministic, and cryptographically provable sentinel. By combining RFC-compliant passive inspection with SHA-256 Merkle provenance, enterprise security teams can eliminate shadow exposures with zero service disruption.", body_style))
    story.append(Paragraph("<b>7.2 Stated Limitations:</b> Passive inspection cannot confirm whether an unallocated cloud bucket is internally reserved by cloud providers. Scans are strictly bounded by approved_scope.json and do not execute internet-wide sweeps.", body_style))
    story.append(Paragraph("<b>7.3 Delivered P2 Features &amp; Regional Roadmap:</b> All Level 2 differentiators are delivered and operational: automated SARIF v2.1.0 export, CSV spreadsheets, one-click executive HTML reports, passive Certificate Transparency monitor, and simulation controllers. For the regional finals (November 2026), the team will extend Post-Quantum Cryptography (PQC) readiness tracking (NIST FIPS 203/204) and distributed multi-cloud edge probe nodes.", body_style))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated {filename} successfully ({os.path.getsize(filename)} bytes)")


if __name__ == "__main__":
    out_pdf = "Proposed-structure-hackathon.pdf"
    if len(sys.argv) > 1:
        out_pdf = sys.argv[1]
    build_pdf(out_pdf)
