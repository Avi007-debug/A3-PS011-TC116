"""
Unit tests for Section 8 P2 features:
- Findings Exports: SARIF, CSV, JSON, Executive Report
- Passive CT Monitor (Candidates without auto-probe)
- Live Evaluation Simulation Scenario Switcher (T0, T1, T2)
"""

import json
from fastapi.testclient import TestClient
from backend.app import app
from backend.engine.export_engine import FindingsExportEngine
from backend.engine.ct_monitor import PassiveCTMonitor

client = TestClient(app)


def test_export_sarif_format():
    response = client.get("/api/v1/export/sarif")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "2.1.0"
    assert "$schema" in data
    assert len(data["runs"]) > 0
    assert data["runs"][0]["tool"]["driver"]["name"] == "ArgusASM"
    assert len(data["runs"][0]["results"]) >= 3


def test_export_csv_format():
    response = client.get("/api/v1/export/csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    content = response.text
    assert "Finding ID,Category,Severity,Target,Port,Title" in content
    assert "legacy.aiori.lab" in content


def test_export_json_format():
    response = client.get("/api/v1/export/json")
    assert response.status_code == 200
    data = response.json()
    assert "metadata" in data
    assert "findings" in data
    assert data["metadata"]["non_exploitation_enforced"] is True
    assert data["summary"]["total_findings"] >= 3


def test_export_executive_report_html():
    response = client.get("/api/v1/export/executive-report")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    html = response.text
    assert "ARGUS-ASM // EXECUTIVE PERIMETER AUDIT" in html
    assert "CRYPTOGRAPHIC TAMPER-EVIDENT MERKLE ATTESTATION" in html


def test_passive_ct_monitor_no_auto_probe():
    response = client.get("/api/v1/ct/candidates")
    assert response.status_code == 200
    data = response.json()
    assert data["policy"] == "PASSIVE_CT_ONLY_NO_AUTO_PROBE"
    assert data["network_probes_dispatched"] == 0
    for cand in data["candidates"]:
        assert cand["auto_probe_allowed"] is False
        assert cand["network_calls_made"] == 0


def test_simulation_state_and_switch():
    # 1. Check current state
    res_get = client.get("/api/v1/simulation/state")
    assert res_get.status_code == 200
    assert "current_scenario" in res_get.json()

    # 2. Switch to T0
    res_sw = client.post("/api/v1/simulation/switch", json={"state": "T0"})
    assert res_sw.status_code == 200
    assert res_sw.json()["applied_state"] == "T0"

    # 3. Switch back to T1
    res_sw_t1 = client.post("/api/v1/simulation/switch", json={"state": "T1"})
    assert res_sw_t1.status_code == 200
    assert res_sw_t1.json()["applied_state"] == "T1"

