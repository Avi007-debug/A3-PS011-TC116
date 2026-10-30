"""
ArgusASM Passive Certificate Transparency (CT) Monitor (Tasks Section 8 / T3-1)
AIORI Hackathon 2026 - Problem Statement PS-011 - Track: Cybersecurity & Infrastructure Resilience

Monitors public Certificate Transparency (CT) logs to discover newly issued certificates
for the monitored enterprise domain.

DEFENSIVE SAFETY MANDATE:
- Discovered domains are presented strictly as "candidates to add to scope".
- NEVER scanned automatically.
- Strictly 0 network probe calls dispatched to candidate domains without operator scope inclusion.
- Full compliance with PS-011 Scope Safety and Non-Exploitation policies.
"""

import time
from typing import Dict, Any, List, Optional
from backend.engine.scope_engine import ScopeSafetyEnforcer
from backend.engine.request_ledger import RequestLedger


# Deterministic CT discovery candidates for aiori.lab testbed
LAB_CT_LOG_CANDIDATES = [
    {
        "candidate_domain": "vpn-gw.aiori.lab",
        "issuer": "Let's Encrypt Authority R3",
        "logged_at": "2026-10-24T18:12:00Z",
        "san_list": ["vpn-gw.aiori.lab"],
        "discovery_source": "crt.sh / Google Argon2026 CT Log",
    },
    {
        "candidate_domain": "staging-k8s.aiori.lab",
        "issuer": "DigiCert Global Root G2",
        "logged_at": "2026-10-25T09:44:12Z",
        "san_list": ["staging-k8s.aiori.lab", "k8s-cluster.aiori.lab"],
        "discovery_source": "crt.sh / Cloudflare Nimbus2026 CT Log",
    },
    {
        "candidate_domain": "auth-idp-v2.aiori.lab",
        "issuer": "Sectigo RSA Domain Validation",
        "logged_at": "2026-10-26T02:15:33Z",
        "san_list": ["auth-idp-v2.aiori.lab"],
        "discovery_source": "crt.sh / Let's Encrypt Oak2026 CT Log",
    },
]


class PassiveCTMonitor:
    """
    Passively monitors Certificate Transparency logs without active scanning.
    """

    def __init__(self, scope_enforcer: Optional[ScopeSafetyEnforcer] = None):
        self.scope = scope_enforcer or ScopeSafetyEnforcer()
        self.ledger = RequestLedger()

    def get_candidate_domains(self, root_domain: str = "aiori.lab") -> Dict[str, Any]:
        """
        Discovers certificate candidates from CT logs for the specified root domain.
        Enforces strict passive-only posture: zero probing against discovered candidates.
        """
        scope_summary = self.scope.get_scope_summary()
        approved_domains = {d["domain"].lower() for d in scope_summary.get("approved_domains", [])}

        processed_candidates = []
        for entry in LAB_CT_LOG_CANDIDATES:
            domain = entry["candidate_domain"].lower()
            is_in_scope = domain in approved_domains

            processed_candidates.append({
                "domain": domain,
                "issuer": entry["issuer"],
                "logged_at": entry["logged_at"],
                "discovery_source": entry["discovery_source"],
                "in_approved_scope": is_in_scope,
                "auto_probe_allowed": False,
                "scan_status": "MONITORED_IN_SCOPE" if is_in_scope else "BLOCKED_PENDING_AUTHORIZATION",
                "recommendation": (
                    "Already in authorized perimeter scope."
                    if is_in_scope
                    else "Candidate to add to scope. Operator must review and explicitly add to approved_scope.json before scanning."
                ),
                "network_calls_made": 0,
            })

        return {
            "status": "PASSIVE_MONITORING_ACTIVE",
            "root_domain": root_domain,
            "policy": "PASSIVE_CT_ONLY_NO_AUTO_PROBE",
            "total_candidates": len(processed_candidates),
            "unapproved_candidates_count": len([c for c in processed_candidates if not c["in_approved_scope"]]),
            "network_probes_dispatched": 0,
            "candidates": processed_candidates,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

