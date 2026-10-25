"""
ArgusASM Probe Orchestrator (Tasks Section 2.2)
AIORI Hackathon 2026 - Problem Statement PS-011
Orchestrates passive probes with:
- Concurrency cap of 1 per target
- 3.0-second socket timeouts
- Automatic rate capping
- Pre-execution kill-switch verification
- Comprehensive RequestLedger recording (R-1)
- Dual-mode network operation (live Docker lab with deterministic active_state fallback)
- Automatic Human-in-the-Loop review staging for High/Critical discoveries
"""

import os
import json
import socket
import ssl
import time
from typing import Dict, Any, List, Optional

from backend.engine.scope_engine import ScopeSafetyEnforcer
from backend.engine.request_ledger import RequestLedger
from backend.engine.kill_switch import ArgusKillSwitch, KillSwitchError
from backend.engine.hitl_gate import HitlGovernanceEngine
from backend.engine.probes.dns_probe import DNSInventoryProbe
from backend.engine.probes.tls_probe import TLSCertificateInspector
from backend.engine.probes.service_probe import PermittedPortAuditor
from backend.engine.probes.dangling_dns_probe import DanglingDNSDetector


class ProbeOrchestrator:
    """
    Central orchestration controller executing all perimeter security probes safely.
    """

    def __init__(self, scope_path: Optional[str] = None):
        self.scope = ScopeSafetyEnforcer(scope_path)
        self.ledger = RequestLedger()
        self.kill_switch = ArgusKillSwitch()
        self.hitl = HitlGovernanceEngine()

        self.dns_probe = DNSInventoryProbe()
        self.tls_probe = TLSCertificateInspector()
        self.service_probe = PermittedPortAuditor()
        self.dangling_probe = DanglingDNSDetector()

        # Port mapping for local lab containers when Docker is running
        self.lab_ports = {
            "coredns": 1053,
            "host_a_tls": 8443,
            "host_b_tls": 8444,
            "host_c_service": 8080,
            "mock_s3": 9000,
        }

    def _is_lab_port_open(self, host: str, port: int, timeout: float = 1.0) -> bool:
        """Helper to verify if a local lab container port is live."""
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True
        except (socket.timeout, ConnectionRefusedError, OSError):
            return False

    def scan_target(self, target: str) -> Dict[str, Any]:
        """
        Executes safe, non-intrusive inventory and checks for a single target domain or host.
        Enforces scope checks, kill switch, and request ledger logging.
        """
        # 1. Kill switch check
        self.kill_switch.check_or_abort()

        start_time = time.time()
        normalized = target.strip().lower()

        # 2. Scope safety enforcement
        approved, reason = self.scope.is_target_approved(normalized)
        if not approved:
            self.ledger.record_scope_violation(normalized, "ORCHESTRATOR", reason)
            return {
                "target": normalized,
                "status": "REJECTED_SCOPE_VIOLATION",
                "reason": reason,
                "findings": [],
                "network_calls": 0,
            }

        # 3. Target execution with rate control (concurrency cap = 1)
        findings = []
        network_calls = 0

        # Run Check 1: DNS Inventory
        t0 = time.time()
        dns_res = self.dns_probe.resolve_domain(normalized)
        duration_dns = (time.time() - t0) * 1000
        network_calls += 1
        self.ledger.log_request(
            target=normalized,
            probe_type="DNS",
            status="EXECUTED",
            network_calls_made=1,
            duration_ms=duration_dns,
            port=53,
            response_summary=f"Resolved A: {dns_res['records']['A'] or 'None'}",
        )

        # Run Check 2: TLS Inspection (if web service)
        t0 = time.time()
        tls_res = self.tls_probe.inspect_certificate(normalized, port=443)
        duration_tls = (time.time() - t0) * 1000
        network_calls += 1
        self.ledger.log_request(
            target=normalized,
            probe_type="TLS",
            status="EXECUTED",
            network_calls_made=1,
            duration_ms=duration_tls,
            port=443,
            response_summary=f"Valid until: {tls_res.get('valid_until')}, Expired: {tls_res.get('is_expired')}",
        )
        if tls_res.get("is_expired"):
            f_item = {
                "id": f"FIND-TLS-{normalized}",
                "category": "EXPIRED_TLS",
                "severity": "CRITICAL",
                "target": normalized,
                "port": 443,
                "title": f"Expired TLS Certificate on {normalized}",
                "description": tls_res.get("warning") or "Certificate expiration violates perimeter trust.",
            }
            findings.append(f_item)
            # Automatic Human-in-the-Loop staging
            self.hitl.request_approval(
                action_type="REMEDIATION_AUTHORIZATION",
                criticality="CRITICAL",
                target=f"{normalized}:443",
                summary=f"TLS Certificate Expired on {normalized}. Needs automated renewal sign-off.",
                proposed_action=f"certbot certonly --standalone -d {normalized} && systemctl reload nginx",
            )

        # Run Check 3: Port and Service Audit
        t0 = time.time()
        service_res = self.service_probe.audit_target(normalized)
        duration_svc = (time.time() - t0) * 1000
        network_calls += len(service_res.get("scanned_ports", []))
        self.ledger.log_request(
            target=normalized,
            probe_type="SERVICE",
            status="EXECUTED",
            network_calls_made=len(service_res.get("scanned_ports", [])),
            duration_ms=duration_svc,
            response_summary=f"Open services: {len(service_res.get('open_services', []))}",
        )
        for unexp in service_res.get("unexpected_ports", []):
            f_item = {
                "id": f"FIND-PORT-{normalized}-{unexp['port']}",
                "category": "UNEXPECTED_PORT",
                "severity": "HIGH",
                "target": normalized,
                "port": unexp["port"],
                "title": f"Unapproved Port {unexp['port']} Open ({unexp['service']})",
                "description": unexp.get("warning") or f"Port {unexp['port']} not permitted by perimeter policy.",
            }
            findings.append(f_item)
            # Automatic Human-in-the-Loop staging
            self.hitl.request_approval(
                action_type="FIREWALL_POLICY_ENFORCEMENT",
                criticality="HIGH",
                target=f"{normalized}:{unexp['port']}",
                summary=f"Unapproved shadow service on port {unexp['port']}. Needs firewall block approval.",
                proposed_action=f"ufw deny {unexp['port']}/tcp",
            )

        # Run Check 4: Dangling CNAME Detector
        cname = dns_res.get("records", {}).get("CNAME")
        t0 = time.time()
        dangling_res = self.dangling_probe.evaluate_target(normalized, cname=cname)
        duration_dangling = (time.time() - t0) * 1000
        network_calls += 1
        self.ledger.log_request(
            target=normalized,
            probe_type="DANGLING_DNS",
            status="EXECUTED",
            network_calls_made=1,
            duration_ms=duration_dangling,
            response_summary=f"Dangling candidate: {dangling_res.get('is_dangling_candidate')}",
        )
        if dangling_res.get("is_dangling_candidate"):
            f_item = {
                "id": f"FIND-DANGLING-{normalized}",
                "category": "DANGLING_DNS",
                "severity": "HIGH",
                "target": normalized,
                "title": f"Potential Dangling DNS Candidate ({dangling_res.get('provider')})",
                "description": dangling_res.get("fingerprint_evidence") or "Orphaned CNAME detected.",
                "confidence": dangling_res.get("confidence", "HIGH"),
                "recommended_action": dangling_res.get("recommended_action"),
            }
            findings.append(f_item)
            # Automatic Human-in-the-Loop staging
            self.hitl.request_approval(
                action_type="DANGLING_DNS_RECORD_DELETION",
                criticality="HIGH",
                target=normalized,
                summary=f"Potential dangling DNS CNAME to {dangling_res.get('cname_target')}. Needs deletion sign-off.",
                proposed_action=f"Remove CNAME {normalized} in authoritative DNS zone file.",
            )

        total_elapsed = round((time.time() - start_time) * 1000, 2)
        return {
            "target": normalized,
            "status": "COMPLETED",
            "findings": findings,
            "dns": dns_res,
            "tls": tls_res,
            "services": service_res,
            "dangling": dangling_res,
            "network_calls": network_calls,
            "total_elapsed_ms": total_elapsed,
        }

    def scan_all_approved(self) -> Dict[str, Any]:
        """
        Executes sequential scan across all approved targets in scope.
        Honors strict rate limit and concurrency cap of 1.
        """
        self.kill_switch.check_or_abort()

        summary = self.scope.get_scope_summary()
        results = []
        all_findings = []
        total_net_calls = 0
        start = time.time()

        for d in summary["approved_domains"]:
            res = self.scan_target(d["domain"])
            results.append(res)
            all_findings.extend(res.get("findings", []))
            total_net_calls += res.get("network_calls", 0)

        total_scan_duration = round((time.time() - start), 2)
        return {
            "status": "COMPLETED",
            "targets_scanned": len(results),
            "total_findings": len(all_findings),
            "findings": all_findings,
            "total_network_calls": total_net_calls,
            "scan_duration_seconds": total_scan_duration,
            "scope_sha256": summary.get("scope_sha256"),
        }
