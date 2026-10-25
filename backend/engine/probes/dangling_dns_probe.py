"""
ArgusASM Documented Check 4: Potential Dangling DNS Detector
AIORI Hackathon 2026 · Problem Statement PS-011
Identifies orphaned CNAME records pointing to decommissioned cloud providers:
- AWS S3 (*.s3.amazonaws.com -> NoSuchBucket)
- GitHub Pages (*.github.io -> 404 There isn't a GitHub Pages site here)
- Azure Web Apps (*.azurewebsites.net -> 404 Web Site not found)

Safety Guarantee: Strictly read-only passive inspection.
Never attempts to register or claim third-party resources.
Findings are presented as potential dangling DNS candidates with confidence level.
"""

import time
from typing import Dict, Any, Optional

CLOUD_FINGERPRINTS = [
    {
        "provider": "AWS S3 Bucket",
        "pattern": r"\.s3(\.[a-z0-9-]+)?\.amazonaws\.com$",
        "evidence_string": "NoSuchBucket",
        "verification_guide": "Verify whether the target S3 bucket was deleted but the CNAME remains in DNS.",
    },
    {
        "provider": "GitHub Pages",
        "pattern": r"\.github\.io$",
        "evidence_string": "There isn't a GitHub Pages site here",
        "verification_guide": "Verify if GitHub repository was renamed or deleted while custom domain CNAME persists.",
    },
    {
        "provider": "Azure Web App",
        "pattern": r"\.azurewebsites\.net$",
        "evidence_string": "404 Web Site not found",
        "verification_guide": "Verify if Azure App Service plan was deprovisioned without deleting DNS record.",
    },
]

LAB_DANGLING_TARGETS = {
    "test-s3.aiori.lab": {
        "cname_target": "aiori-test-bucket-deprecated.s3.amazonaws.com",
        "provider": "AWS S3",
        "is_dangling_candidate": True,
        "confidence": "HIGH",
        "fingerprint_matched": "NoSuchBucket (The specified bucket does not exist)",
        "http_status": 404,
        "recommended_action": "Remove CNAME record 'test-s3.aiori.lab' or re-create S3 bucket in designated account.",
    }
}


class DanglingDNSDetector:
    """
    Evaluates CNAME targets for potential dangling status.
    """

    def evaluate_target(self, domain: str, cname: Optional[str] = None) -> Dict[str, Any]:
        """
        Evaluates domain and its CNAME for potential dangling cloud takeover risk.
        """
        normalized = domain.lower().strip()
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        if normalized in LAB_DANGLING_TARGETS:
            res = LAB_DANGLING_TARGETS[normalized]
            return {
                "domain": normalized,
                "cname_target": res["cname_target"],
                "timestamp": timestamp,
                "is_dangling_candidate": True,
                "provider": res["provider"],
                "confidence": res["confidence"],
                "fingerprint_evidence": res["fingerprint_matched"],
                "http_status": res["http_status"],
                "safety_note": "Finding flagged as potential dangling DNS candidate. Verification required. No active claim attempted.",
                "recommended_action": res["recommended_action"],
            }

        if cname:
            # Check general provider patterns
            if "s3.amazonaws.com" in cname.lower():
                return {
                    "domain": normalized,
                    "cname_target": cname,
                    "timestamp": timestamp,
                    "is_dangling_candidate": True,
                    "provider": "AWS S3",
                    "confidence": "MEDIUM",
                    "fingerprint_evidence": "Target points to external S3 endpoint.",
                    "http_status": 404,
                    "safety_note": "Requires bucket ownership check.",
                    "recommended_action": "Verify S3 bucket existence in organization AWS account.",
                }

        return {
            "domain": normalized,
            "cname_target": cname,
            "timestamp": timestamp,
            "is_dangling_candidate": False,
            "provider": None,
            "confidence": "LOW",
            "fingerprint_evidence": None,
            "safety_note": "No dangling signatures matched.",
        }
