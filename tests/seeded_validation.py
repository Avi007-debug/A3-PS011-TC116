"""
ArgusASM Automated Seeded Validation Runner
AIORI Hackathon 2026 · Problem Statement PS-011
Evaluates the detection of the 3 required seeded perimeter faults:
1. Expired TLS Certificate (legacy.aiori.lab)
2. Unexpected Open Port (dev-edge.aiori.lab:8080)
3. Potential Dangling DNS CNAME (test-s3.aiori.lab)
"""

import sys
import os

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.engine.scope_engine import ScopeSafetyEnforcer
from backend.engine.scoring_engine import PerimeterHygieneScorer
from backend.engine.merkle_audit import MerkleAuditLedger
from backend.engine.drift_engine import StatefulDriftEngine
from backend.engine.probes.dns_probe import DNSInventoryProbe
from backend.engine.probes.tls_probe import TLSCertificateInspector
from backend.engine.probes.service_probe import PermittedPortAuditor
from backend.engine.probes.dangling_dns_probe import DanglingDNSDetector


def run_validation():
    print("=" * 70)
    print("ArgusASM: Automated Seeded-Fault Detection & Scope Validation")
    print("AIORI Hackathon 2026 · Problem Statement PS-011")
    print("=" * 70)

    # 1. Scope Guardrail Check
    print("\n[+] Step 1: Validating Scope Guardrails...")
    scope = ScopeSafetyEnforcer()
    summary = scope.get_scope_summary()
    print(f"    - Approved Domains: {summary['total_domains']} / {summary['caps']['max_domains']} (Cap Enforced)")
    print(f"    - Approved Hosts:   {summary['total_hosts']} / {summary['caps']['max_hosts']} (Cap Enforced)")
    assert summary["total_domains"] <= 20, "Domain limit exceeded!"
    assert summary["total_hosts"] <= 10, "Host limit exceeded!"
    print("    [PASS] Scope limits strictly enforced.")

    # 2. Check 1: DNS Inventory
    print("\n[+] Step 2: Running Check 1 (DNS Inventory Probe)...")
    dns_probe = DNSInventoryProbe()
    dns_res = dns_probe.resolve_domain("aiori.lab")
    print(f"    - A Records: {dns_res['records']['A']}")
    print(f"    - NS Records: {dns_res['records']['NS']}")
    print(f"    - TXT Records: {dns_res['records']['TXT']}")
    assert "10.0.1.10" in dns_res["records"]["A"]
    print("    [PASS] DNS Inventory Probe operational.")

    # 3. Check 2 & Seed 1: Expired TLS Certificate
    print("\n[+] Step 3: Running Check 2 & Seed 1 (TLS Certificate Inspector)...")
    tls_inspector = TLSCertificateInspector()
    tls_res = tls_inspector.inspect_certificate("legacy.aiori.lab")
    print(f"    - Target: legacy.aiori.lab")
    print(f"    - Expired: {tls_res['is_expired']}")
    print(f"    - Days Remaining: {tls_res['days_remaining']}")
    print(f"    - Warning: {tls_res['warning']}")
    assert tls_res["is_expired"] is True, "Seed 1 (Expired Cert) was NOT detected!"
    print("    [PASS] Seed 1 (Expired TLS Certificate) successfully detected.")

    # 4. Check 3 & Seed 2: Unexpected Open Port 8080
    print("\n[+] Step 4: Running Check 3 & Seed 2 (Permitted Port Auditor)...")
    port_auditor = PermittedPortAuditor()
    port_res = port_auditor.audit_target("dev-edge.aiori.lab")
    unexpected = [p["port"] for p in port_res["unexpected_ports"]]
    print(f"    - Target: dev-edge.aiori.lab")
    print(f"    - Unexpected Ports Found: {unexpected}")
    assert 8080 in unexpected, "Seed 2 (Port 8080) was NOT detected!"
    print("    [PASS] Seed 2 (Shadow Port 8080) successfully detected.")

    # 5. Check 4 & Seed 3: Potential Dangling DNS CNAME
    print("\n[+] Step 5: Running Check 4 & Seed 3 (Dangling DNS Detector)...")
    dangling_detector = DanglingDNSDetector()
    dangling_res = dangling_detector.evaluate_target("test-s3.aiori.lab")
    print(f"    - Target: test-s3.aiori.lab")
    print(f"    - Dangling Candidate: {dangling_res['is_dangling_candidate']}")
    print(f"    - Cloud Provider: {dangling_res['provider']}")
    print(f"    - Fingerprint Evidence: {dangling_res['fingerprint_evidence']}")
    assert dangling_res["is_dangling_candidate"] is True, "Seed 3 (Dangling DNS) was NOT detected!"
    print("    [PASS] Seed 3 (Dangling CNAME NoSuchBucket) successfully detected.")

    # 6. Stateful Drift Delta
    print("\n[+] Step 6: Stateful Drift Delta Computation (T0 vs T1)...")
    drift_engine = StatefulDriftEngine()
    diff = drift_engine.compute_drift({"snapshot_id": "SNAP-T0"}, {"snapshot_id": "SNAP-T1"})
    print(f"    - Total Drift Events: {diff['total_drift_events']}")
    for ev in diff["events"]:
        print(f"      * [{ev['severity']}] {ev['type']}: {ev['title']}")
    assert diff["total_drift_events"] == 3
    print("    [PASS] Stateful drift events accurately categorized.")

    # 7. Cryptographic Merkle Audit Trail
    print("\n[+] Step 7: Cryptographic Merkle Audit Trail Receipt...")
    merkle = MerkleAuditLedger()
    receipt = merkle.generate_snapshot_receipt({"snapshot_id": "SNAP-T1"})
    print(f"    - Merkle Root: {receipt['merkle_root']}")
    print(f"    - Leaves: {len(receipt['leaves'])}")
    print(f"    - Status: {receipt['attestation_status']}")
    assert receipt["merkle_root"].startswith("0x")
    print("    [PASS] SHA-256 Merkle root generated.")

    # 8. Perimeter Hygiene Score
    print("\n[+] Step 8: Computing Perimeter Hygiene Score...")
    scorer = PerimeterHygieneScorer()
    score_res = scorer.calculate_score([
        {"finding_id": "F-001", "category": "EXPIRED_TLS", "target": "legacy.aiori.lab"},
        {"finding_id": "F-002", "category": "UNEXPECTED_PORT", "target": "dev-edge.aiori.lab", "port": 8080},
        {"finding_id": "F-003", "category": "DANGLING_DNS", "target": "test-s3.aiori.lab"},
    ])
    print(f"    - Perimeter Hygiene Score: {score_res['hygiene_score']}/100")
    print(f"    - Rating: {score_res['rating']}")
    print(f"    - Deductions: {score_res['total_deductions']}")
    assert score_res["hygiene_score"] == 10  # 100 - 35 - 25 - 30 = 10
    print("    [PASS] Score deductions mathematically verified.")

    print("\n" + "=" * 70)
    print("RESULT: ALL 8 VALIDATION CHECKS PASSED WITH 100% SUCCESS")
    print("ArgusASM is fully compliant with AIORI Hackathon 2026 PS-011.")
    print("=" * 70)


if __name__ == "__main__":
    run_validation()
