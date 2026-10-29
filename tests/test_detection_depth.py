"""
Unit tests for ArgusASM Extended Detection Depth & Remediation (Tasks Section 6)
AIORI Hackathon 2026 - Problem Statement PS-011
Tests:
- Extended TLS checks: hostname mismatch, self-signed, weak protocol, 14-day expiry
- Email hygiene: SPF and DMARC parsing
- Dangling NS and MX target detection
- Multi-provider remediation directives (Route53, Cloudflare JSON, Certbot, UFW, iptables, Nginx)
"""

from backend.engine.probes.tls_probe import TLSCertificateInspector
from backend.engine.probes.dns_probe import DNSInventoryProbe
from backend.engine.remediation import RemediationAdvisor


def test_extended_tls_checks():
    inspector = TLSCertificateInspector()

    # 1. Staging Self-Signed Check
    res_staging = inspector.inspect_certificate("staging.aiori.lab")
    assert res_staging["is_self_signed"] is True
    assert res_staging["chain_problems"] is True
    assert any(f["type"] == "SELF_SIGNED_CERT" for f in res_staging["extended_findings"])

    # 2. Certificate Expiring Within 14 Days
    res_expiring = inspector.inspect_certificate("expiring.aiori.lab")
    assert res_expiring["is_expiring_soon"] is True
    assert res_expiring["days_remaining"] == 7
    assert any(f["type"] == "CERT_EXPIRING_SOON" for f in res_expiring["extended_findings"])

    # 3. Weak TLS & Key Size
    res_weak = inspector.inspect_certificate("weak-tls.aiori.lab")
    assert res_weak["is_deprecated_protocol"] is True
    assert res_weak["is_weak_key"] is True
    assert any(f["type"] == "WEAK_TLS" for f in res_weak["extended_findings"])
    assert any(f["type"] == "WEAK_KEY_SIZE" for f in res_weak["extended_findings"])

    # 4. Hostname Mismatch Check
    res_mismatch = inspector.inspect_certificate("subdomain-unlisted.aiori.lab")
    # Custom SAN checking
    assert inspector._matches_san("api.aiori.lab", ["api.aiori.lab"]) is True
    assert inspector._matches_san("dev.aiori.lab", ["*.aiori.lab"]) is True
    assert inspector._matches_san("other.com", ["*.aiori.lab"]) is False


def test_email_security_spf_dmarc():
    probe = DNSInventoryProbe()

    # Apex domain with SPF and DMARC
    res = probe.resolve_domain("aiori.lab")
    sec = res["email_security"]
    assert sec["has_spf"] is True
    assert "v=spf1" in sec["spf_record"]
    assert sec["has_dmarc"] is True
    assert sec["dmarc_policy"] in ["quarantine", "reject", "none"]

    # Permissive SPF warning check
    weak_sec = probe.audit_email_security("insecure.org", ["v=spf1 +all"])
    assert any("+all" in w for w in weak_sec["warnings"])

    # Missing SPF/DMARC warning check
    missing_sec = probe.audit_email_security("no-email.org", [])
    assert missing_sec["has_spf"] is False
    assert missing_sec["has_dmarc"] is False
    assert len(missing_sec["warnings"]) >= 2


def test_dangling_ns_and_mx_checks():
    probe = DNSInventoryProbe()

    # Domain with dormant nameserver
    res_ns = probe.resolve_domain("dangling-ns.aiori.lab")
    health_ns = res_ns["delegation_health"]
    assert health_ns["has_dangling_ns"] is True
    assert "dormant-cloud" in health_ns["dangling_ns_candidates"][0]["target"]

    # Domain with unresolvable mail exchanger
    res_mx = probe.resolve_domain("dangling-mx.aiori.lab")
    health_mx = res_mx["delegation_health"]
    assert health_mx["has_dangling_mx"] is True
    assert "expired-host" in health_mx["dangling_mx_candidates"][0]["target"]


def test_comprehensive_remediation_generation():
    advisor = RemediationAdvisor()

    # 1. Dangling DNS (Route53 + Cloudflare JSON)
    rem_dns = advisor.generate_remediation("DANGLING_DNS", "test-s3.aiori.lab")
    assert "route53" in rem_dns["code"].lower()
    assert "cloudflare" in rem_dns["code"].lower()
    assert rem_dns["cloudflare_json"]["method"] == "DELETE"

    # 2. Expired TLS (Certbot)
    rem_tls = advisor.generate_remediation("EXPIRED_TLS", "legacy.aiori.lab")
    assert "certbot certonly" in rem_tls["code"]
    assert "dry-run" in rem_tls["code"]

    # 3. Port Firewall (UFW + iptables)
    rem_port = advisor.generate_remediation("UNEXPECTED_PORT", "dev-edge.aiori.lab:8080")
    assert "ufw deny" in rem_port["code"]
    assert "iptables" in rem_port["code"]

    # 4. Weak TLS (Nginx)
    rem_weak = advisor.generate_remediation("WEAK_TLS", "weak-tls.aiori.lab")
    assert "ssl_protocols TLSv1.2 TLSv1.3" in rem_weak["code"]

    # 5. Lookup by finding ID
    rem_f1 = advisor.get_remediation_by_finding_id("FIND-TLS-legacy.aiori.lab")
    assert rem_f1["category"] == "EXPIRED_TLS"


def test_dynamic_topology_graph_engine():
    from backend.engine.graph_engine import PerimeterGraphEngine
    from backend.engine.snapshot_engine import SnapshotEngine

    snapshot_engine = SnapshotEngine()
    graph_engine = PerimeterGraphEngine()

    # Test T1 (Drifted)
    t1_snap = snapshot_engine.get_snapshot("T1")
    assert t1_snap is not None
    graph_t1 = graph_engine.build_graph_from_snapshot(t1_snap)
    assert graph_t1["snapshot_id"] == "SNAP-T1"
    assert len(graph_t1["nodes"]) >= 8
    assert len(graph_t1["links"]) >= 8
    # Assert drifted nodes have critical/warning status
    legacy_node = next(n for n in graph_t1["nodes"] if n["id"] == "sub-legacy")
    assert legacy_node["status"] == "critical"
    assert legacy_node["deduction"] == 35

    dev_node = next(n for n in graph_t1["nodes"] if n["id"] == "sub-dev")
    assert dev_node["status"] == "warning"
    assert dev_node["port"] == 8080

    s3_node = next(n for n in graph_t1["nodes"] if n["id"] == "sub-s3")
    assert s3_node["status"] == "critical"

    # Test T0 (Clean Baseline)
    t0_snap = snapshot_engine.get_snapshot("T0")
    assert t0_snap is not None
    graph_t0 = graph_engine.build_graph_from_snapshot(t0_snap)
    assert all(n["status"] == "healthy" for n in graph_t0["nodes"])

    # Test T2 (Remediated)
    t2_snap = snapshot_engine.get_snapshot("T2")
    assert t2_snap is not None
    graph_t2 = graph_engine.build_graph_from_snapshot(t2_snap)
    assert all(n["status"] == "healthy" for n in graph_t2["nodes"])


def test_api_graph_and_remediation_endpoints():
    from backend.app import get_snapshot_graph, get_remediation_by_finding

    # 1. Test GET /api/v1/graph/T1
    graph_data = get_snapshot_graph("T1")
    assert "nodes" in graph_data
    assert "links" in graph_data
    assert "edges" in graph_data
    assert graph_data["state_id"] == "T1"
    assert len(graph_data["nodes"]) >= 8

    # 2. Test GET /api/v1/remediation/FIND-01
    rem1_data = get_remediation_by_finding("FIND-01")
    assert rem1_data["category"] == "EXPIRED_TLS"
    assert "certbot" in rem1_data["code"].lower()

    # 3. Test GET /api/v1/remediation/FIND-02 (Port)
    rem2_data = get_remediation_by_finding("FIND-02")
    assert rem2_data["category"] == "UNEXPECTED_PORT"
    assert "ufw" in rem2_data["code"].lower()

    # 4. Test GET /api/v1/remediation/FIND-03 (Dangling DNS)
    rem3_data = get_remediation_by_finding("FIND-03")
    assert rem3_data["category"] == "DANGLING_DNS"
    assert "route53" in rem3_data["code"].lower()

