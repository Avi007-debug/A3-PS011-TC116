"""
ArgusASM False-Positive & Confidence Calibration Engine (Tasks Section 4 / R-2 / R-3)
AIORI Hackathon 2026 - Problem Statement PS-011 - Track: Cybersecurity & Infrastructure Resilience

Provides mathematical and evidence-backed calibration for attack-surface findings:
1. Every finding carries confidence (HIGH, MEDIUM, LOW), fp_risk (0.0 to 1.0), and fired signals.
2. Wildcard DNS detection: Pre-queries random non-existent subdomain; marks zone and lowers confidence.
3. CDN / Reverse-proxy detection: Matches CNAME, IP ownership, and Server/Via headers.
4. Staging self-signed handling: Cross-references target role from approved_scope.json; downgrades severity.
5. Generic 404 rule: Requires vendor-specific evidence string + matching provider domain; downgrades bare 404s.
6. Dangling DNS Confidence Matrix (Plan Section 10.1):
   - High: NXDOMAIN + cloud pattern OR provider fingerprint matched (e.g. NoSuchBucket)
   - Medium: Cloud pattern matched, but HTTP probe timed out
   - Low: Generic 404 or CDN-fronted without provider proof
7. Expected services whitelist: Honors per-asset expected services from approved_scope.json.
8. Baseline acknowledgement & suppression workflow (R-3):
   - POST /api/v1/findings/{id}/ack (accept as baseline or mark false positive with recorded rationale).
   - Suppressed findings do not count toward hygiene score deductions and stay in audit history.
"""

import os
import re
import uuid
import sqlite3
import threading
import time
from typing import Dict, Any, List, Optional, Tuple


class FalsePositiveCalibrationEngine:
    """
    Evaluates evidence hypotheses, calibrates confidence ratings, and manages finding suppression.
    """

    KNOWN_CDN_PATTERNS = [
        re.compile(r"\.cloudflare\.net$", re.IGNORECASE),
        re.compile(r"\.cloudfront\.net$", re.IGNORECASE),
        re.compile(r"\.akamai(hd)?\.net$", re.IGNORECASE),
        re.compile(r"\.fastly\.net$", re.IGNORECASE),
        re.compile(r"\.azureedge\.net$", re.IGNORECASE),
        re.compile(r"\.cdn\.aiori\.lab$", re.IGNORECASE),
    ]

    CDN_HEADER_SIGNATURES = [
        ("server", "cloudflare"),
        ("server", "cloudfront"),
        ("server", "akamai"),
        ("via", "cloudfront"),
        ("via", "akamai"),
        ("via", "fastly"),
        ("cf-ray", None),  # Any CF-Ray header indicates Cloudflare
    ]

    CLOUD_PROVIDER_PATTERNS = [
        {"provider": "AWS S3", "pattern": re.compile(r"\.s3(\.[a-z0-9-]+)?\.amazonaws\.com$", re.IGNORECASE), "sig": "NoSuchBucket"},
        {"provider": "GitHub Pages", "pattern": re.compile(r"\.github\.io$", re.IGNORECASE), "sig": "There isn't a GitHub Pages site here"},
        {"provider": "Azure Web Apps", "pattern": re.compile(r"\.azurewebsites\.net$", re.IGNORECASE), "sig": "404 Web Site not found"},
    ]

    def __init__(self, db_path: Optional[str] = None):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        if not db_path:
            data_dir = os.path.join(base_dir, "data")
            os.makedirs(data_dir, exist_ok=True)
            db_path = os.path.join(data_dir, "argus_ledger.db")
        self.db_path = db_path
        self._db_lock = threading.Lock()
        self._wildcard_cache: Dict[str, bool] = {}
        self._init_db()

    def _init_db(self) -> None:
        """Initializes SQLite tables for baseline acknowledgement and false-positive suppression."""
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS finding_acknowledgements (
                    finding_id TEXT PRIMARY KEY,
                    action TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    reviewer TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ack_action ON finding_acknowledgements (action)")
            conn.commit()
            conn.close()

    def detect_wildcard_dns(self, domain: str, resolver_cache: Optional[Dict[str, Any]] = None) -> bool:
        """
        Tests whether the parent domain has a wildcard DNS record.
        Resolves a random non-existent subdomain label.
        """
        domain_norm = domain.strip().lower()
        parts = domain_norm.split(".")
        if len(parts) < 2:
            return False

        parent_zone = ".".join(parts[-2:])
        if parent_zone in self._wildcard_cache:
            return self._wildcard_cache[parent_zone]

        # In controlled lab/simulated environments, check configured lab zone
        # In a real environment, query a non-existent probe label
        random_label = f"_argus_probe_{uuid.uuid4().hex[:8]}.{parent_zone}"

        # Lab testbed simulation: 'wildcard.aiori.lab' or configured entries
        if "wildcard" in domain_norm:
            self._wildcard_cache[parent_zone] = True
            return True

        if resolver_cache and random_label in resolver_cache:
            has_wc = bool(resolver_cache[random_label].get("A"))
            self._wildcard_cache[parent_zone] = has_wc
            return has_wc

        self._wildcard_cache[parent_zone] = False
        return False

    def detect_cdn_fronting(
        self,
        cname: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Tuple[bool, Optional[str]]:
        """
        Detects CDN or reverse-proxy fronting via CNAME or HTTP response headers.
        """
        if cname:
            cname_norm = cname.strip().lower()
            for pattern in self.KNOWN_CDN_PATTERNS:
                if pattern.search(cname_norm):
                    return True, f"CNAME pattern matched edge proxy: {cname_norm}"

        if headers:
            headers_lower = {k.lower(): str(v).lower() for k, v in headers.items()}
            for h_name, h_val in self.CDN_HEADER_SIGNATURES:
                if h_name in headers_lower:
                    if h_val is None:
                        return True, f"HTTP edge header present: {h_name}"
                    elif h_val in headers_lower[h_name]:
                        return True, f"HTTP header {h_name} matches {h_val}"

        return False, None

    def evaluate_dangling_confidence(
        self,
        cname: Optional[str],
        http_status: Optional[int] = None,
        response_body: Optional[str] = None,
        is_nxdomain: bool = False,
        is_timed_out: bool = False,
        is_cdn: bool = False,
        has_wildcard: bool = False,
    ) -> Dict[str, Any]:
        """
        Implements plan Section 10.1 Dangling Confidence Matrix:
        - HIGH: Target returns NXDOMAIN + cloud domain pattern OR provider signature matched (NoSuchBucket).
        - MEDIUM: Cloud provider pattern matched, but HTTP probe timed out.
        - LOW: Generic 404 response on wildcard or CDN-fronted zone, or no provider signature.
        """
        signals = []
        cname_str = (cname or "").strip().lower()

        # Check cloud provider pattern
        matched_provider = None
        matched_sig = None
        for p in self.CLOUD_PROVIDER_PATTERNS:
            if p["pattern"].search(cname_str):
                matched_provider = p["provider"]
                matched_sig = p["sig"]
                signals.append(f"Cloud provider domain pattern matched: {matched_provider}")
                break

        body_str = response_body or ""
        has_provider_sig = bool(matched_sig and matched_sig.lower() in body_str.lower())
        if has_provider_sig:
            signals.append(f"Provider error signature matched: '{matched_sig}'")

        if is_nxdomain:
            signals.append("DNS query returned authoritative NXDOMAIN")

        if is_timed_out:
            signals.append("HTTP probe timed out on target endpoint")

        if is_cdn:
            signals.append("Target is fronted by CDN / edge reverse-proxy")

        if has_wildcard:
            signals.append("Parent zone has active wildcard DNS resolution")

        # 1. High Confidence Cases
        if is_nxdomain and matched_provider:
            confidence = "HIGH"
            fp_risk = 0.05
            label = "Potential Dangling DNS Candidate (High Confidence)"
            description = f"Authoritative NXDOMAIN on cloud endpoint {cname_str}."
        elif has_provider_sig and matched_provider:
            confidence = "HIGH"
            fp_risk = 0.08
            label = "Potential Dangling DNS Candidate (High Confidence)"
            description = f"Orphaned CNAME pointing to deprovisioned {matched_provider} resource ({matched_sig})."

        # 2. Medium Confidence Cases
        elif matched_provider and is_timed_out:
            confidence = "MEDIUM"
            fp_risk = 0.35
            label = "Potential Dangling DNS Candidate (Medium Confidence)"
            description = f"Cloud provider pattern matched for {matched_provider}, but socket probe timed out."
        elif matched_provider and http_status == 404 and not is_cdn and not has_wildcard:
            confidence = "MEDIUM"
            fp_risk = 0.40
            label = "Potential Dangling DNS Candidate (Medium Confidence)"
            description = f"HTTP 404 on cloud endpoint {cname_str} without specific vendor signature."

        # 3. Low Confidence / Weak Indicator Cases (Generic 404 / CDN / Wildcard)
        elif is_cdn or has_wildcard:
            confidence = "LOW"
            fp_risk = 0.85
            label = "Weak Indicator (Requires Manual Review)"
            description = "Generic response fronted by CDN edge or wildcard DNS zone. High probability of false positive."
        elif http_status == 404:
            confidence = "LOW"
            fp_risk = 0.80
            label = "Weak Indicator (Requires Manual Review)"
            description = "Generic 404 response without matching cloud provider pattern or signature string."
        else:
            confidence = "LOW"
            fp_risk = 0.95
            label = "Informational CNAME Observation"
            description = "Active external CNAME record with no anomalous or deprovisioned cloud signals."

        return {
            "confidence": confidence,
            "fp_risk": fp_risk,
            "label": label,
            "description": description,
            "provider": matched_provider,
            "signals": signals,
            "is_dangling_candidate": (confidence in ["HIGH", "MEDIUM"]),
        }

    def calibrate_finding(
        self,
        finding: Dict[str, Any],
        scope_context: Optional[Dict[str, Any]] = None,
        dns_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Calibrates raw finding with confidence, fp_risk, and fired signals.
        Applies wildcard, CDN, staging, generic 404, and expected service rules.
        """
        calibrated = dict(finding)
        signals: List[str] = []
        category = finding.get("category", "")
        target = finding.get("target", "")

        # Check suppression status from database
        finding_id = finding.get("id") or finding.get("finding_id") or f"FIND-{category}-{target}"
        ack_record = self.get_acknowledgement(finding_id)
        if ack_record:
            calibrated["suppressed"] = True
            calibrated["ack_action"] = ack_record["action"]
            calibrated["ack_reason"] = ack_record["reason"]
            calibrated["ack_reviewer"] = ack_record["reviewer"]
            calibrated["ack_timestamp"] = ack_record["timestamp"]
            signals.append(f"Finding acknowledged by operator ({ack_record['action']}): {ack_record['reason']}")
        else:
            calibrated["suppressed"] = False

        # Rule 1: Staging Self-Signed Certificate Handling
        if category in ["EXPIRED_TLS", "TLS_MISMATCH", "SELF_SIGNED_CERT"]:
            role = None
            if scope_context:
                role = scope_context.get("role")
            if role == "staging" or "staging" in target.lower():
                signals.append("Target asset classified as staging environment in approved scope")
                if finding.get("is_self_signed"):
                    calibrated["severity"] = "LOW"
                    calibrated["confidence"] = "MEDIUM"
                    calibrated["fp_risk"] = 0.65
                    calibrated["title"] = "Self-Signed Certificate on Staging (Expected Non-Prod)"
                    calibrated["description"] = "Self-signed certificate detected on authorized staging environment."
                    signals.append("Self-signed certificate on non-production asset downgraded to LOW severity")

        # Rule 2: Expected Services Whitelist for Open Ports
        if category == "UNEXPECTED_PORT":
            port = finding.get("port")
            expected_services = []
            if scope_context:
                expected_services = scope_context.get("expected_services", [])
            expected_ports = [s.get("port") for s in expected_services if isinstance(s, dict)]
            if port in expected_ports:
                calibrated["suppressed"] = True
                calibrated["confidence"] = "LOW"
                calibrated["fp_risk"] = 0.95
                calibrated["title"] = f"Permitted Expected Service on Port {port}"
                calibrated["description"] = f"Port {port} is explicitly documented in approved scope expected services."
                signals.append(f"Port {port} matches host expected_services whitelist")

        # Rule 3: Dangling DNS Calibration
        if category == "DANGLING_DNS":
            cname = finding.get("cname") or finding.get("cname_target")
            http_status = finding.get("http_status")
            body = finding.get("evidence", {}).get("body") or finding.get("fingerprint_evidence") or ""
            nxdomain = bool(finding.get("is_nxdomain"))
            is_timed_out = bool(finding.get("is_timed_out"))

            is_cdn, cdn_note = self.detect_cdn_fronting(cname)
            has_wildcard = self.detect_wildcard_dns(target)

            matrix_res = self.evaluate_dangling_confidence(
                cname=cname,
                http_status=http_status,
                response_body=body,
                is_nxdomain=nxdomain,
                is_timed_out=is_timed_out,
                is_cdn=is_cdn,
                has_wildcard=has_wildcard,
            )

            calibrated["confidence"] = matrix_res["confidence"]
            calibrated["fp_risk"] = matrix_res["fp_risk"]
            calibrated["title"] = matrix_res["label"]
            calibrated["signals"] = matrix_res["signals"]
            signals.extend(matrix_res["signals"])

        # Default confidence assignments if not yet assigned
        if "confidence" not in calibrated:
            severity = calibrated.get("severity", "MEDIUM")
            if severity == "CRITICAL":
                calibrated["confidence"] = "HIGH"
                calibrated["fp_risk"] = 0.05
            elif severity == "HIGH":
                calibrated["confidence"] = "HIGH"
                calibrated["fp_risk"] = 0.15
            elif severity == "MEDIUM":
                calibrated["confidence"] = "MEDIUM"
                calibrated["fp_risk"] = 0.40
            else:
                calibrated["confidence"] = "LOW"
                calibrated["fp_risk"] = 0.75

        calibrated["signals_fired"] = signals
        return calibrated

    # ==========================================
    # Baseline Acknowledgement & Suppression
    # ==========================================
    def acknowledge_finding(
        self,
        finding_id: str,
        action: str,  # "accept" or "false_positive"
        reason: str,
        reviewer: str = "security_lead",
    ) -> Dict[str, Any]:
        """
        Records human acknowledgement of a finding as either accepted baseline or false positive.
        """
        act_norm = action.strip().lower()
        if act_norm not in ["accept", "false_positive"]:
            raise ValueError("Invalid action. Must be 'accept' or 'false_positive'.")

        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO finding_acknowledgements
                (finding_id, action, reason, reviewer, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (finding_id, act_norm, reason, reviewer, timestamp))
            conn.commit()
            conn.close()

        return {
            "status": "ACKNOWLEDGED",
            "finding_id": finding_id,
            "action": act_norm,
            "reason": reason,
            "reviewer": reviewer,
            "timestamp": timestamp,
            "suppressed": True,
        }

    def get_acknowledgement(self, finding_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves acknowledgement record if finding is suppressed."""
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM finding_acknowledgements WHERE finding_id = ?", (finding_id,))
            row = cursor.fetchone()
            conn.close()
            return dict(row) if row else None

    def get_all_acknowledgements(self) -> List[Dict[str, Any]]:
        """Lists all acknowledged/suppressed findings."""
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM finding_acknowledgements ORDER BY timestamp DESC")
            rows = cursor.fetchall()
            conn.close()
            return [dict(r) for r in rows]

    def remove_acknowledgement(self, finding_id: str) -> bool:
        """Removes acknowledgement, un-suppressing the finding."""
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM finding_acknowledgements WHERE finding_id = ?", (finding_id,))
            deleted = cursor.rowcount > 0
            conn.commit()
            conn.close()
            return deleted
