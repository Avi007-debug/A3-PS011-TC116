"""
Unit tests for Section 8 P2 features:
- Findings Exports: SARIF, CSV, JSON, Executive Report
- Passive CT Monitor (Candidates without auto-probe)
- Live Evaluation Simulation Scenario Switcher (T0, T1, T2)
"""

from backend.app import (
    export_findings_sarif,
    export_findings_csv,
    export_findings_json,
    export_executive_html_report,
    get_ct_candidates,
    get_simulation_state,
    switch_simulation_state,
    ScenarioSwitchRequest,
)
from backend.engine.export_engine import FindingsExportEngine
from backend.engine.ct_monitor import PassiveCTMonitor


def test_export_sarif_format():
    sarif_doc = export_findings_sarif()
    assert sarif_doc["version"] == "2.1.0"
    assert "$schema" in sarif_doc
    assert len(sarif_doc["runs"]) > 0
    assert sarif_doc["runs"][0]["tool"]["driver"]["name"] == "ArgusASM"
    assert len(sarif_doc["runs"][0]["results"]) >= 3


def test_export_csv_format():
    response = export_findings_csv()
    content = response.body.decode("utf-8") if hasattr(response, "body") else str(response)
    assert "Finding ID,Category,Severity,Target,Port,Title" in content
    assert "legacy.aiori.lab" in content


def test_export_json_format():
    data = export_findings_json()
    assert "metadata" in data
    assert "findings" in data
    assert data["metadata"]["non_exploitation_enforced"] is True
    assert data["summary"]["total_findings"] >= 3


def test_export_executive_report_html():
    response = export_executive_html_report()
    html = response.body.decode("utf-8") if hasattr(response, "body") else str(response)
    assert "ARGUS-ASM // EXECUTIVE PERIMETER AUDIT" in html
    assert "CRYPTOGRAPHIC TAMPER-EVIDENT MERKLE ATTESTATION" in html


def test_passive_ct_monitor_no_auto_probe():
    data = get_ct_candidates(domain="aiori.lab")
    assert data["policy"] == "PASSIVE_CT_ONLY_NO_AUTO_PROBE"
    assert data["network_probes_dispatched"] == 0
    for cand in data["candidates"]:
        assert cand["auto_probe_allowed"] is False
        assert cand["network_calls_made"] == 0


def test_simulation_state_and_switch():
    # 1. Check current state
    state_info = get_simulation_state()
    assert "current_scenario" in state_info

    # 2. Switch to T0
    req_t0 = ScenarioSwitchRequest(state="T0")
    res_t0 = switch_simulation_state(req_t0)
    assert res_t0["applied_state"] == "T0"

    # 3. Switch back to T1
    req_t1 = ScenarioSwitchRequest(state="T1")
    res_t1 = switch_simulation_state(req_t1)
    assert res_t1["applied_state"] == "T1"
