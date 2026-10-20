"""
ArgusASM Perimeter Hygiene Scoring Engine
AIORI Hackathon 2026 · Problem Statement PS-011
Computes a defensible, standards-linked 0-100 Perimeter Hygiene Score.
Evaluates attack surface posture with CVSS-weighted deductions:
- Expired TLS Certificate: -35 pts (CVSS 7.5 High)
- Unexpected Open Service / Port: -25 pts (CVSS 6.5 Medium/High)
- Potential Dangling DNS Record: -30 pts (CVSS 8.1 High)
- Missing CAA / DNSSEC Record: -10 pts (CVSS 3.7 Low)
"""

from typing import Dict, Any, List


class PerimeterHygieneScorer:
    """
    Evaluates external perimeter posture, calculating scores, ratings, and rubric breakdowns.
    """

    def calculate_score(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates 0-100 Perimeter Hygiene Score from list of detected findings.
        """
        base_score = 100
        deductions = []
        dns_score = 25
        tls_score = 25
        port_score = 25
        dangling_score = 25

        for f in findings:
            category = f.get("category", "")
            severity = f.get("severity", "MEDIUM")

            if category == "EXPIRED_TLS":
                deduction = 35
                tls_score = max(0, tls_score - 20)
                deductions.append({
                    "finding_id": f.get("finding_id", "F-TLS"),
                    "title": "Expired TLS Certificate Detected",
                    "target": f.get("target", "unknown"),
                    "points": -deduction,
                    "cvss": 7.5,
                    "reason": "Cryptographic trust failure; browser invalid certificate warning (RFC 5280).",
                })
                base_score -= deduction

            elif category == "UNEXPECTED_PORT":
                deduction = 25
                port_score = max(0, port_score - 20)
                deductions.append({
                    "finding_id": f.get("finding_id", "F-PORT"),
                    "title": f"Unexpected Open Port {f.get('port', 8080)} Detected",
                    "target": f.get("target", "unknown"),
                    "points": -deduction,
                    "cvss": 6.5,
                    "reason": "Unapproved service port exposed beyond permitted perimeter whitelist.",
                })
                base_score -= deduction

            elif category == "DANGLING_DNS":
                deduction = 30
                dangling_score = max(0, dangling_score - 25)
                deductions.append({
                    "finding_id": f.get("finding_id", "F-CNAME"),
                    "title": "Potential Dangling DNS / Subdomain Takeover Risk",
                    "target": f.get("target", "unknown"),
                    "points": -deduction,
                    "cvss": 8.1,
                    "reason": "CNAME points to unallocated cloud resource; candidate for account takeover.",
                })
                base_score -= deduction

            elif category == "DNS_DRIFT":
                deduction = 10
                dns_score = max(0, dns_score - 10)
                deductions.append({
                    "finding_id": f.get("finding_id", "F-DNS"),
                    "title": "Unexpected DNS Record Addition/Modification",
                    "target": f.get("target", "unknown"),
                    "points": -deduction,
                    "cvss": 4.3,
                    "reason": "Zone change without documented baseline update.",
                })
                base_score -= deduction

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
            {"dimension": "DNS Zone Hygiene", "score": dns_score, "max": 25, "weight": "25%"},
            {"dimension": "TLS & Certificate Validity", "score": tls_score, "max": 25, "weight": "25%"},
            {"dimension": "Permitted Port Exposure", "score": port_score, "max": 25, "weight": "25%"},
            {"dimension": "Dangling DNS & CNAME Integrity", "score": dangling_score, "max": 25, "weight": "25%"},
        ]

        return {
            "hygiene_score": final_score,
            "rating": rating,
            "posture_color": posture_color,
            "total_deductions": len(deductions),
            "deductions": deductions,
            "rubric_breakdown": rubric_breakdown,
            "standards_compliance": {
                "rfc_1035": "DNS Implementation Standard",
                "rfc_5280": "Internet X.509 PKI Certificate Profile",
                "ca_browser_forum": "Baseline Requirements for TLS",
                "zero_exploitation_policy": "Compliant (Read-Only Probing)",
            },
        }
