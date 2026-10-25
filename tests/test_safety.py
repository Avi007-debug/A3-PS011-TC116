"""
ArgusASM Scope Safety & Policy Enforcement Test Suite
AIORI Hackathon 2026 - Problem Statement PS-011
Verifies:
1. Hard limits (20 domains, 10 hosts) cannot be exceeded.
2. Out-of-scope targets are rejected with strictly ZERO network calls (audited via RequestLedger).
3. Port whitelist [22, 53, 80, 443, 8080] cannot be bypassed.
4. Validity window expiry halts probing.
5. Kill switch halts all probe execution.
"""

import os
import json
import tempfile
import pytest
from datetime import datetime, timezone, timedelta

from backend.engine.scope_engine import ScopeSafetyEnforcer
from backend.engine.request_ledger import RequestLedger
from backend.engine.kill_switch import ArgusKillSwitch, KillSwitchError


@pytest.fixture
def clean_ledger():
    ledger = RequestLedger()
    ledger.clear()
    return ledger


def test_scope_hard_caps_enforced():
    """Verify that exceeding 20 domains or 10 hosts raises ValueError."""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        data = {
            "project": "ArgusASM",
            "approved_domains": [{"domain": f"sub{i}.aiori.lab"} for i in range(21)],
            "approved_hosts": [{"ip": f"10.0.1.{i}"} for i in range(5)],
        }
        json.dump(data, f)
        temp_path = f.name

    try:
        with pytest.raises(ValueError, match="exceeds PS-011 limit of 20"):
            ScopeSafetyEnforcer(temp_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_host_hard_cap_enforced():
    """Verify that exceeding 10 hosts raises ValueError."""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        data = {
            "project": "ArgusASM",
            "approved_domains": [{"domain": "aiori.lab"}],
            "approved_hosts": [{"ip": f"10.0.1.{i}"} for i in range(11)],
        }
        json.dump(data, f)
        temp_path = f.name

    try:
        with pytest.raises(ValueError, match="exceeds PS-011 limit of 10"):
            ScopeSafetyEnforcer(temp_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_out_of_scope_rejection_zero_network_calls(clean_ledger):
    """Verify out-of-scope targets are rejected and logged with 0 network calls."""
    enforcer = ScopeSafetyEnforcer()

    unauthorized_targets = ["external-target.com", "192.168.1.100", "8.8.8.8", "attacker.io"]
    for target in unauthorized_targets:
        approved, reason = enforcer.is_target_approved(target)
        assert approved is False
        assert "NOT in approved scope" in reason

        # Log violation in ledger
        clean_ledger.record_scope_violation(target, "DNS", reason)

    # Verify ledger records
    entries = clean_ledger.get_entries(limit=10, status_filter="ScopeViolation")
    assert len(entries) == 4
    for e in entries:
        assert e["network_calls_made"] == 0
        assert e["status"] == "ScopeViolation"

    stats = clean_ledger.get_stats()
    assert stats["scope_violations_blocked"] == 4
    assert stats["total_network_calls"] == 0


def test_port_whitelist_strict_enforcement():
    """Verify only ports 22, 53, 80, 443, 8080 are permitted."""
    enforcer = ScopeSafetyEnforcer()

    # Allowed
    for port in [22, 53, 80, 443, 8080]:
        assert enforcer.is_port_permitted(port) is True

    # Strictly forbidden
    for port in [21, 23, 25, 135, 139, 445, 1433, 3306, 3389, 4444, 9999]:
        assert enforcer.is_port_permitted(port) is False


def test_validity_window_rejection(clean_ledger):
    """Verify that probing outside the authorized time window is blocked."""
    enforcer = ScopeSafetyEnforcer()

    # Artificially check a future expired date
    future_expired = datetime(2027, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    valid, reason = enforcer.is_authorization_valid(check_time=future_expired)
    assert valid is False
    assert "expired" in reason.lower()

    # Past unstarted date
    past_unstarted = datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    valid_past, reason_past = enforcer.is_authorization_valid(check_time=past_unstarted)
    assert valid_past is False
    assert "not started yet" in reason_past.lower()


def test_kill_switch_operation():
    """Verify kill switch halts execution and raises KillSwitchError."""
    ks = ArgusKillSwitch()
    ks.deactivate()
    assert ks.is_active() is False

    # Engagement
    status = ks.activate(reason="Test emergency stop", operator="pytest_runner")
    assert ks.is_active() is True
    assert status["status"] == "ENGAGED"

    with pytest.raises(KillSwitchError, match="ArgusASM Kill Switch ENGAGED"):
        ks.check_or_abort()

    # Deactivation
    ks.deactivate(operator="pytest_runner")
    assert ks.is_active() is False
    ks.check_or_abort()  # Should not raise
