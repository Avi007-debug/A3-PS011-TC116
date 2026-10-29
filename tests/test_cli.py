"""
Unit tests for ArgusASM CLI (Tasks Section 7)
AIORI Hackathon 2026 - Problem Statement PS-011
Tests:
- argus scan --scope approved_scope.json
- argus diff --baseline T0 --current T1
- argus verify --snapshot T1 and --chain
- argus ledger
- argus kill and argus kill --reset
- POST /api/v1/cli/execute endpoint
"""

from argus import execute_argus_command
from backend.app import execute_cli_endpoint, CliExecuteRequest
from backend.engine.kill_switch import ArgusKillSwitch


def test_cli_help():
    res = execute_argus_command("argus --help")
    assert res["exit_code"] == 0
    assert "usage: argus" in res["output"]
    assert "scan" in res["output"]
    assert "diff" in res["output"]


def test_cli_scan():
    res = execute_argus_command("argus scan --scope approved_scope.json")
    assert res["exit_code"] == 0
    assert "Loading approved_scope.json" in res["output"]
    assert "Scope Validation:" in res["output"]
    assert "Findings Detected:" in res["output"]


def test_cli_diff():
    res = execute_argus_command("argus diff --baseline T0 --current T1")
    assert res["exit_code"] == 0
    assert "Comparing Baseline Snapshot T0 with Current Snapshot T1" in res["output"]
    assert "Total Drift Events:" in res["output"]


def test_cli_verify():
    # Single snapshot verification
    res_snap = execute_argus_command("argus verify --snapshot T1")
    assert res_snap["exit_code"] == 0
    assert "VERIFIED_TAMPER_FREE" in res_snap["output"]
    assert "0x84228964" in res_snap["output"]

    # Full chain verification
    res_chain = execute_argus_command("argus verify --chain")
    assert res_chain["exit_code"] == 0
    assert "Chain Continuity: VALID & UNBROKEN" in res_chain["output"]


def test_cli_ledger():
    res = execute_argus_command("argus ledger --limit 5")
    assert res["exit_code"] == 0
    assert "Outbound Probe Request Ledger" in res["output"]
    assert "TIMESTAMP" in res["output"]
    assert "Zero Out-of-Scope Network Traffic Enforced" in res["output"]


def test_cli_kill_switch_cycle():
    # Engage
    res_kill = execute_argus_command("argus kill")
    assert res_kill["exit_code"] == 0
    assert "EMERGENCY KILL-SWITCH TRIGGERED" in res_kill["output"]
    assert ArgusKillSwitch().is_active() is True

    # Scan should be blocked while kill switch is engaged
    res_blocked = execute_argus_command("argus scan --scope approved_scope.json")
    assert res_blocked["exit_code"] == 1
    assert "SCAN ABORTED" in res_blocked["output"]

    # Reset
    res_reset = execute_argus_command("argus kill --reset")
    assert res_reset["exit_code"] == 0
    assert "deactivated" in res_reset["output"]
    assert ArgusKillSwitch().is_active() is False


def test_cli_remediate():
    res = execute_argus_command("argus remediate --finding FIND-01")
    assert res["exit_code"] == 0
    assert "Safe Remediation Directives" in res["output"]
    assert "certbot" in res["output"].lower()


def test_api_cli_execute_endpoint():
    req = CliExecuteRequest(command="argus diff --baseline T0 --current T1")
    res = execute_cli_endpoint(req)
    assert res["exit_code"] == 0
    assert "Comparing Baseline Snapshot" in res["output"]
