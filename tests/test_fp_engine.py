"""
Unit tests for ArgusASM False-Positive & Confidence Calibration Engine (Tasks Section 4)
AIORI Hackathon 2026 - Problem Statement PS-011
Tests:
- Wildcard DNS detection and confidence damping
- CDN / reverse-proxy fronting detection
- Staging self-signed certificate handling (severity downgrade)
- Generic 404 rule (requires provider pattern + error signature)
- Dangling DNS confidence matrix (High, Medium, Low)
- Per-asset expected services whitelist suppression
- Baseline acknowledgement & suppression workflow (R-3)
- Hygiene score deduction caps per class (Section 8.3)
"""

from backend.engine.fp_engine import FalsePositiveCalibrationEngine
from backend.engine.scoring_engine import PerimeterHygieneScorer


def test_wildcard_dns_detection():
    engine = FalsePositiveCalibrationEngine()
    is_wc = engine.detect_wildcard_dns("wildcard.aiori.lab")
    assert is_wc is True

    # Dangling check under wildcard should result in LOW confidence
    eval_res = engine.evaluate_dangling_confidence(
        cname="wildcard-target.s3.amazonaws.com",
        http_status=404,
        response_body="Generic 404",
        has_wildcard=True,
    )
    assert eval_res["confidence"] == "LOW"
    assert eval_res["fp_risk"] >= 0.80


def test_cdn_fronting_detection():
    engine = FalsePositiveCalibrationEngine()

    # CNAME pattern match
    is_cdn, note = engine.detect_cdn_fronting(cname="assets.cloudflare.net")
    assert is_cdn is True
    assert "Cloudflare" in note or "cloudflare" in note

    # HTTP header match
    is_cdn_hdr, note_hdr = engine.detect_cdn_fronting(headers={"server": "cloudflare", "cf-ray": "8a1b2c3d"})
    assert is_cdn_hdr is True

    # Dangling probe fronted by CDN without signature is Low confidence
    eval_res = engine.evaluate_dangling_confidence(
        cname="cdn-edge.cloudfront.net",
        http_status=404,
        is_cdn=True,
    )
    assert eval_res["confidence"] == "LOW"


def test_staging_self_signed_downgrade():
    engine = FalsePositiveCalibrationEngine()

    finding = {
        "finding_id": "FIND-TLS-STAGING",
        "category": "SELF_SIGNED_CERT",
        "severity": "CRITICAL",
        "target": "staging.aiori.lab",
        "is_self_signed": True,
    }

    calibrated = engine.calibrate_finding(finding, scope_context={"role": "staging"})
    assert calibrated["severity"] == "LOW"
    assert calibrated["confidence"] == "MEDIUM"
    assert "Staging" in calibrated["title"]


def test_generic_404_rule():
    engine = FalsePositiveCalibrationEngine()

    # Generic 404 without matching cloud provider pattern
    res_generic = engine.evaluate_dangling_confidence(
        cname="unrelated-static-host.example.com",
        http_status=404,
        response_body="<html><title>404 Not Found</title></html>",
    )
    assert res_generic["confidence"] == "LOW"
    assert res_generic["is_dangling_candidate"] is False

    # 404 with matching S3 domain AND NoSuchBucket signature string
    res_signature = engine.evaluate_dangling_confidence(
        cname="aiori-orphaned.s3.amazonaws.com",
        http_status=404,
        response_body="<Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist</Message></Error>",
    )
    assert res_signature["confidence"] == "HIGH"
    assert res_signature["is_dangling_candidate"] is True


def test_dangling_dns_confidence_matrix():
    engine = FalsePositiveCalibrationEngine()

    # High: Authoritative NXDOMAIN on cloud pattern
    high_nxdomain = engine.evaluate_dangling_confidence(
        cname="decommissioned-app.azurewebsites.net",
        is_nxdomain=True,
    )
    assert high_nxdomain["confidence"] == "HIGH"

    # High: Matched signature
    high_sig = engine.evaluate_dangling_confidence(
        cname="test.github.io",
        response_body="There isn't a GitHub Pages site here",
    )
    assert high_sig["confidence"] == "HIGH"

    # Medium: Cloud pattern matched, but HTTP probe timed out
    med_timeout = engine.evaluate_dangling_confidence(
        cname="pending-bucket.s3.amazonaws.com",
        is_timed_out=True,
    )
    assert med_timeout["confidence"] == "MEDIUM"


def test_expected_services_whitelist_suppression():
    engine = FalsePositiveCalibrationEngine()

    scope_host = {
        "hostname": "gw-01.aiori.lab",
        "ip": "10.0.1.10",
        "expected_services": [
            {"port": 22, "service": "ssh"},
            {"port": 80, "service": "http"},
            {"port": 8080, "service": "alt-http"},  # Whitelisted port 8080
        ],
    }

    port_finding = {
        "finding_id": "FIND-PORT-gw01-8080",
        "category": "UNEXPECTED_PORT",
        "severity": "HIGH",
        "target": "gw-01.aiori.lab",
        "port": 8080,
    }

    calibrated = engine.calibrate_finding(port_finding, scope_context=scope_host)
    assert calibrated["suppressed"] is True
    assert calibrated["confidence"] == "LOW"
    assert "Permitted Expected Service" in calibrated["title"]


def test_baseline_acknowledgement_workflow():
    engine = FalsePositiveCalibrationEngine()
    scorer = PerimeterHygieneScorer()

    finding_id = "FIND-TEST-ACK-001"
    raw_finding = {
        "finding_id": finding_id,
        "category": "EXPIRED_TLS",
        "severity": "CRITICAL",
        "target": "legacy.aiori.lab",
    }

    # Before acknowledgement: score deducted by 35 points
    calibrated_before = engine.calibrate_finding(raw_finding)
    score_before = scorer.calculate_score([calibrated_before])
    assert score_before["hygiene_score"] == 65

    # Operator acknowledges finding as accepted baseline
    ack_res = engine.acknowledge_finding(
        finding_id=finding_id,
        action="accept",
        reason="Approved legacy decommission waiver until Q4",
        reviewer="ciso_lead",
    )
    assert ack_res["status"] == "ACKNOWLEDGED"

    # After acknowledgement: finding is suppressed, score recovers to 100
    calibrated_after = engine.calibrate_finding(raw_finding)
    assert calibrated_after["suppressed"] is True
    score_after = scorer.calculate_score([calibrated_after])
    assert score_after["hygiene_score"] == 100
    assert score_after["suppressed_findings_count"] == 1

    # Cleanup
    engine.remove_acknowledgement(finding_id)


def test_scoring_deduction_caps():
    scorer = PerimeterHygieneScorer()

    # 3 Expired TLS findings (3 x 35 = 105 nominal points)
    # Master Plan Section 8.3 sets Expired TLS cap at -70 pts
    findings = [
        {"finding_id": "F-TLS-1", "category": "EXPIRED_TLS", "confidence": "HIGH"},
        {"finding_id": "F-TLS-2", "category": "EXPIRED_TLS", "confidence": "HIGH"},
        {"finding_id": "F-TLS-3", "category": "EXPIRED_TLS", "confidence": "HIGH"},
    ]

    score_res = scorer.calculate_score(findings)
    assert score_res["hygiene_score"] == 30  # 100 - 70 (capped) = 30
    capped_rules = [c for c in score_res["caps_breakdown"] if c["class"] == "EXPIRED_TLS"]
    assert len(capped_rules) == 1
    assert capped_rules[0]["is_capped"] is True
    assert capped_rules[0]["total_deducted"] == 70

