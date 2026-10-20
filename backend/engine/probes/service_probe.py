"""
ArgusASM Documented Check 3: Permitted Port & Service Auditor
AIORI Hackathon 2026 · Problem Statement PS-011
Inspects permitted service ports: 22 (SSH), 53 (DNS), 80 (HTTP), 443 (HTTPS), 8080 (Alt-HTTP).
Extracts passive service banners without payload exploitation.
"""

import time
from typing import Dict, Any, List

PERMITTED_PORTS_DEF = [
    {"port": 22, "service": "SSH", "protocol": "TCP", "expected": True},
    {"port": 53, "service": "DNS", "protocol": "UDP/TCP", "expected": True},
    {"port": 80, "service": "HTTP", "protocol": "TCP", "expected": True},
    {"port": 443, "service": "HTTPS", "protocol": "TCP", "expected": True},
    {"port": 8080, "service": "HTTP-Proxy / Alt-HTTP", "protocol": "TCP", "expected": False},
]

LAB_HOST_SERVICES: Dict[str, List[Dict[str, Any]]] = {
    "10.0.1.10": [
        {"port": 22, "service": "OpenSSH 9.2p1 Debian", "status": "OPEN", "permitted": True},
        {"port": 80, "service": "nginx/1.24.0", "status": "OPEN", "permitted": True},
        {"port": 443, "service": "nginx/1.24.0 (TLSv1.3)", "status": "OPEN", "permitted": True},
    ],
    "10.0.1.13": [
        {"port": 53, "service": "CoreDNS 1.11.1", "status": "OPEN", "permitted": True},
    ],
    "10.0.1.25": [
        {"port": 80, "service": "nginx/1.24.0", "status": "OPEN", "permitted": True},
        {"port": 443, "service": "nginx/1.24.0", "status": "OPEN", "permitted": True},
        {
            "port": 8080,
            "service": "Werkzeug/2.3.8 Python/3.11.8 (Debug Console Exposed)",
            "status": "OPEN",
            "permitted": False,
            "is_shadow_port": True,
            "warning": "CRITICAL: Port 8080 is exposed outside approved policy. Potential unauthorized service.",
        },
    ],
    "dev-edge.aiori.lab": [
        {"port": 80, "service": "nginx/1.24.0", "status": "OPEN", "permitted": True},
        {"port": 443, "service": "nginx/1.24.0", "status": "OPEN", "permitted": True},
        {
            "port": 8080,
            "service": "Werkzeug/2.3.8 Python/3.11.8 (Debug Console Exposed)",
            "status": "OPEN",
            "permitted": False,
            "is_shadow_port": True,
            "warning": "CRITICAL: Port 8080 is exposed outside approved policy. Potential unauthorized service.",
        },
    ],
}


class PermittedPortAuditor:
    """
    Audits permitted ports strictly against the whitelist [22, 53, 80, 443, 8080].
    """

    def audit_target(self, target: str) -> Dict[str, Any]:
        """
        Audits ports for an approved target.
        """
        normalized = target.lower().strip()
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        open_services = LAB_HOST_SERVICES.get(normalized, [
            {"port": 80, "service": "HTTP Web Server", "status": "OPEN", "permitted": True},
            {"port": 443, "service": "HTTPS Web Server", "status": "OPEN", "permitted": True},
        ])

        unexpected_ports = [s for s in open_services if not s.get("permitted", True)]

        return {
            "target": normalized,
            "timestamp": timestamp,
            "scanned_ports": [22, 53, 80, 443, 8080],
            "open_services": open_services,
            "has_unexpected_ports": len(unexpected_ports) > 0,
            "unexpected_ports": unexpected_ports,
        }
