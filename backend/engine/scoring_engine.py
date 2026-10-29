"""
ArgusASM Perimeter Hygiene Scoring Engine (Tasks Section 4 / Section 8.3)
AIORI Hackathon 2026 · Problem Statement PS-011

Computes a defensible, standards-linked 0-100 Perimeter Hygiene Score:
Score = max(0, 100 - sum(Deductions))

Enforces strict per-class deduction caps (Master Plan Section 8.3):
- Expired TLS Certificate: -35 pts (Cap: -70 pts)
- Certificate Expiring Within 14 Days: -10 pts (Cap: -30 pts)
- Unexpected Open Service / Port: -25 pts (Cap: -50 pts)
- Potential Dangling CNAME (High Confidence): -30 pts (Cap: -60 pts)
- Potential Dangling CNAME (Medium Confidence): -15 pts (Cap: -30 pts)
- Potential Dangling CNAME (Low Confidence): -5 pts (Cap: -15 pts)
- Hostname Mismatch or Self-Signed Certificate: -10 pts (Cap: -20 pts)
- Weak TLS Configuration (TLS 1.0/1.1): -5 pts (Cap: -15 pts)
- Unexpected DNS Drift: -10 pts (Cap: -30 pts)

Suppressed findings (operator acknowledged or verified false positive) carry 0 deduction.
"""

from typing import Dict, Any, List


class PerimeterHygieneScorer:
    """
    Evaluates external perimeter posture, calculating scores, ratings, deduction caps, and rubric breakdowns.
    """

    CLASS_CAPS = {
        "EXPIRED_TLS": {"deduction": 35, "cap": 70, "cvss": 7.5, "dim": "tls"},
        "CERT_EXPIRING_SOON": {"deduction": 10, "cap": 30, "cvss": 4.5, "dim": "tls"},
        "UNEXPECTED_PORT": {"deduction": 25, "cap": 50, "cvss": 6.5, "dim": "port"},
        "DANGLING_DNS_HIGH": {"deduction": 30, "cap": 60, "cvss": 8.1, "dim": "dangling"},
        "DANGLING_DNS_MEDIUM": {"deduction": 15, "cap": 30, "cvss": 5.5, "dim": "dangling"},
        "DANGLING_DNS_LOW": {"deduction": 5, "cap": 15, "cvss": 3.1, "dim": "dangling"},
        "TLS_MISMATCH": {"deduction": 10, "cap": 20, "cvss": 5.0, "dim": "tls"},
        "SELF_SIGNED_CERT": {"deduction": 10, "cap": 20, "cvss": 4.0, "dim": "tls"},
        "WEAK_TLS": {"deduction": 5, "cap": 15, "cvss": 4.0, "dim": "tls"},
        "DNS_DRIFT": {"deduction": 10, "cap": 30, "cvss": 4.3, "dim": "dns"},
    }

    def _resolve_rule(self, finding: Dict[str, Any]) -> str:
        """Maps a finding to its exact capped rubric class."""
        category = finding.get("category", "")
        confidence = str(finding.get("confidence", "HIGH")).upper()

        if category == "EXPIRED_TLS":
            if finding.get("is_expiring_soon") and not finding.get("is_expired"):
                return "CERT_EXPIRING_SOON"
            return "EXPIRED_TLS"

        if category == "DANGLING_DNS":
            if confidence == "LOW":
                return "DANGLING_DNS_LOW"
            elif confidence == "MEDIUM":
                return "DANGLING_DNS_MEDIUM"
            return "DANGLING_DNS_HIGH"

        if category in ["TLS_MISMATCH", "HOSTNAME_MISMATCH"]:
            return "TLS_MISMATCH"

        if category in ["SELF_SIGNED_CERT", "STAGING_SELF_SIGNED"]:
            return "SELF_SIGNED_CERT"

        if category in ["WEAK_TLS", "DEPRECATED_PROTOCOL"]:
            return "WEAK_TLS"

        if category in ["UNEXPECTED_PORT", "SHADOW_PORT"]:
            return "UNEXPECTED_PORT"

        if category in ["DNS_DRIFT", "ZONE_DRIFT"]:
            return "DNS_DRIFT"

        return category

    def calculate_score(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates 0-100 Perimeter Hygiene Score from list of findings, enforcing per-class caps.
        """
        base_score = 100
        deductions = []
        class_deductions: Dict[str, int] = {}
        suppressed_count = 0

        dim_scores = {
            "dns": 25,
            "tls": 25,
            "port": 25,
            "dangling": 25,
        }

        for f in findings:
            # 1. Skip suppressed / acknowledged findings
            if f.get("suppressed"):
                suppressed_count += 1
                deductions.append({
                    "finding_id": f.get("finding_id") or f.get("id", "F-SUPPRESSED"),
                    "title": f.get("title", "Acknowledged Finding"),
                    "target": f.get("target", "unknown"),
                    "points": 0,
                    "cvss": f.get("cvss", 0.0),
                    "suppressed": True,
                    "reason": f"Finding suppressed by operator: {f.get('ack_reason', 'Verified baseline')}",
                })
                continue

            rule_key = self._resolve_rule(f)
            rule_spec = self.CLASS_CAPS.get(rule_key, {"deduction": 15, "cap": 45, "cvss": 5.0, "dim": "dns"})

            current_class_total = class_deductions.get(rule_key, 0)
            nominal_deduction = rule_spec["deduction"]
            cap = rule_spec["cap"]

            # Enforce deduction cap per class
            effective_deduction = max(0, min(nominal_deduction, cap - current_class_total))
            is_capped = (current_class_total >= cap)

            if effective_deduction > 0:
                class_deductions[rule_key] = current_class_total + effective_deduction
                base_score -= effective_deduction

                dim = rule_spec.get("dim", "dns")
                dim_scores[dim] = max(0, dim_scores[dim] - min(effective_deduction, 20))

            deductions.append({
                "finding_id": f.get("finding_id") or f.get("id", "F-UNKNOWN"),
                "category": rule_key,
                "title": f.get("title", f"Security Finding ({rule_key})"),
                "target": f.get("target", "unknown"),
                "points": -effective_deduction,
                "nominal_points": -nominal_deduction,
                "is_capped": is_capped,
                "class_cap": cap,
                "cvss": rule_spec.get("cvss", f.get("cvss", 5.0)),
                "suppressed": False,
                "reason": f.get("description") or f"Finding in class {rule_key}.",
            })

        final_score = max(0, min(100, base_score))

        if final_score >= 90:
            rating = "HARDENED"
            posture_color = "emerald"
        elif final_score >= 70:
            rating = "ACCEPTABLE"
            posture_color = "blue"
        elif final_score >= 50:
            rating = "ELEVATED_RISK"
            posture_color = "amber"
        else:
            rating = "CRITICAL_DRIFT"
            posture_color = "rose"

        rubric_breakdown = [
            {"dimension": "DNS Zone Hygiene", "score": dim_scores["dns"], "max": 25, "weight": "25%"},
            {"dimension": "TLS & Certificate Validity", "score": dim_scores["tls"], "max": 25, "weight": "25%"},
            {"dimension": "Permitted Port Exposure", "score": dim_scores["port"], "max": 25, "weight": "25%"},
            {"dimension": "Dangling DNS & CNAME Integrity", "score": dim_scores["dangling"], "max": 25, "weight": "25%"},
        ]

        # Detailed caps audit table for evaluation display
        caps_breakdown = []
        for c_key, c_info in self.CLASS_CAPS.items():
            used = class_deductions.get(c_key, 0)
            caps_breakdown.append({
                "class": c_key,
                "deduction_per_finding": c_info["deduction"],
                "cap": c_info["cap"],
                "total_deducted": used,
                "is_capped": used >= c_info["cap"],
            })

        return {
            "hygiene_score": final_score,
            "rating": rating,
            "posture_color": posture_color,
            "total_deductions": len([d for d in deductions if not d.get("suppressed")]),
            "suppressed_findings_count": suppressed_count,
            "deductions": deductions,
            "rubric_breakdown": rubric_breakdown,
            "caps_breakdown": caps_breakdown,
            "standards_compliance": {
                "rfc_1035": "DNS Implementation Standard",
                "rfc_5280": "Internet X.509 PKI Certificate Profile",
                "ca_browser_forum": "Baseline Requirements for TLS",
                "zero_exploitation_policy": "Compliant (Read-Only Probing)",
                "deduction_caps_policy": "Section 8.3 Enforced",
            },
        }
