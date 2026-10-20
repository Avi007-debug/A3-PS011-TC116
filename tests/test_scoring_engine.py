"""
Unit tests for ArgusASM Perimeter Hygiene Scoring Engine
"""

from backend.engine.scoring_engine import PerimeterHygieneScorer


def test_clean_perimeter_score():
    scorer = PerimeterHygieneScorer()
    res = scorer.calculate_score([])

    assert res["hygiene_score"] == 100
    assert res["rating"] == "HARDENED"
    assert res["total_deductions"] == 0


def test_seeded_findings_deductions():
    scorer = PerimeterHygieneScorer()
    findings = [
        {"finding_id": "F-001", "category": "EXPIRED_TLS", "target": "legacy.aiori.lab"},
        {"finding_id": "F-002", "category": "UNEXPECTED_PORT", "target": "dev-edge.aiori.lab:8080", "port": 8080},
    ]
    res = scorer.calculate_score(findings)

    # 100 - 35 (TLS) - 25 (Port) = 40
    assert res["hygiene_score"] == 40
    assert res["rating"] == "CRITICAL_DRIFT"
    assert res["total_deductions"] == 2
    assert len(res["rubric_breakdown"]) == 4
