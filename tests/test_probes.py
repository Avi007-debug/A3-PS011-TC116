"""
Unit tests for ArgusASM Documented Probes (DNS, TLS, Ports, Dangling DNS)
"""

from backend.engine.probes.dns_probe import DNSInventoryProbe
from backend.engine.probes.tls_probe import TLSCertificateInspector
from backend.engine.probes.service_probe import PermittedPortAuditor
from backend.engine.probes.dangling_dns_probe import DanglingDNSDetector


def test_dns_probe():
    probe = DNSInventoryProbe()
    res = probe.resolve_domain("aiori.lab")
    assert res["status"] == "RESOLVED"
    assert "10.0.1.10" in res["records"]["A"]
    assert res["ttl"] == 300


def test_tls_probe_expired_cert_detection():
    inspector = TLSCertificateInspector()
    res = inspector.inspect_certificate("legacy.aiori.lab")
    assert res["is_expired"] is True
    assert res["days_remaining"] < 0
    assert "CRITICAL" in res["warning"]


def test_service_probe_unexpected_port():
    auditor = PermittedPortAuditor()
    res = auditor.audit_target("dev-edge.aiori.lab")
    assert res["has_unexpected_ports"] is True
    unexpected = [p["port"] for p in res["unexpected_ports"]]
    assert 8080 in unexpected


def test_dangling_dns_probe():
    detector = DanglingDNSDetector()
    res = detector.evaluate_target("test-s3.aiori.lab")
    assert res["is_dangling_candidate"] is True
    assert res["provider"] == "AWS S3"
    assert "NoSuchBucket" in res["fingerprint_evidence"]
