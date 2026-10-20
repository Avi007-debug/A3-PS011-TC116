"""
ArgusASM Scope Safety & Policy Enforcer
AIORI Hackathon 2026 · Problem Statement PS-011
Enforces hard guardrails: Maximum 20 domains, 10 hosts.
Strictly non-intrusive, read-only authorized attack surface monitoring.
"""

import json
import os
from typing import Dict, Any, List, Optional, Tuple


class ScopeSafetyEnforcer:
    """
    Enforces scope boundaries and non-exploitation policy before any check is scheduled.
    """

    MAX_DOMAINS = 20
    MAX_HOSTS = 10
    PERMITTED_PORTS = {22, 53, 80, 443, 8080}

    def __init__(self, scope_path: Optional[str] = None):
        if not scope_path:
            # Look in repository root
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            scope_path = os.path.join(base_dir, "approved_scope.json")

        self.scope_path = scope_path
        self.approved_domains: List[Dict[str, Any]] = []
        self.approved_hosts: List[Dict[str, Any]] = []
        self.scope_metadata: Dict[str, Any] = {}
        self.load_scope()

    def load_scope(self) -> None:
        """Loads and validates approved_scope.json."""
        if not os.path.exists(self.scope_path):
            raise FileNotFoundError(f"Mandatory approved scope definition not found at {self.scope_path}")

        with open(self.scope_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        domains = data.get("approved_domains", [])
        hosts = data.get("approved_hosts", [])

        if len(domains) > self.MAX_DOMAINS:
            raise ValueError(f"Scope violation: {len(domains)} domains exceeds PS-011 limit of {self.MAX_DOMAINS}")

        if len(hosts) > self.MAX_HOSTS:
            raise ValueError(f"Scope violation: {len(hosts)} hosts exceeds PS-011 limit of {self.MAX_HOSTS}")

        self.approved_domains = domains
        self.approved_hosts = hosts
        self.scope_metadata = {
            "project": data.get("project", "ArgusASM"),
            "hackathon": data.get("hackathon", "AIORI Hackathon 2026"),
            "problem_statement": data.get("problem_statement", "PS-011"),
            "domain_count": len(domains),
            "host_count": len(hosts),
            "max_domains": self.MAX_DOMAINS,
            "max_hosts": self.MAX_HOSTS,
            "enforce_non_exploitation": True,
            "passive_probing_only": True,
        }

    def is_target_approved(self, target: str) -> Tuple[bool, str]:
        """
        Validates if target domain or IP is within the approved scope list.
        """
        target = target.strip().lower()

        # Check domains
        for d in self.approved_domains:
            if d.get("domain", "").lower() == target:
                return True, f"Approved domain (Role: {d.get('role', 'production')})"

        # Check hosts
        for h in self.approved_hosts:
            if h.get("ip") == target or h.get("hostname", "").lower() == target:
                return True, f"Approved host (Role: {h.get('role', 'production')})"

        return False, f"Target '{target}' is NOT in approved scope. Aborting execution per PS-011 guardrails."

    def is_port_permitted(self, port: int) -> bool:
        """Enforces port inspection whitelist [22, 53, 80, 443, 8080]."""
        return port in self.PERMITTED_PORTS

    def get_scope_summary(self) -> Dict[str, Any]:
        """Returns structured summary for UI HUD and API."""
        return {
            "status": "GUARDRAILS_ACTIVE",
            "approved_domains": self.approved_domains,
            "approved_hosts": self.approved_hosts,
            "total_domains": len(self.approved_domains),
            "total_hosts": len(self.approved_hosts),
            "caps": {
                "max_domains": self.MAX_DOMAINS,
                "max_hosts": self.MAX_HOSTS,
            },
            "permitted_ports": sorted(list(self.PERMITTED_PORTS)),
            "safety_policy": {
                "zero_exploitation": True,
                "read_only": True,
                "active_takeover_prohibited": True,
            },
        }
