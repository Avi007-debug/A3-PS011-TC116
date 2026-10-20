"""
Unit tests for ArgusASM Scope Safety Enforcer
"""

import pytest
from backend.engine.scope_engine import ScopeSafetyEnforcer


def test_scope_enforcer_initialization():
    enforcer = ScopeSafetyEnforcer()
    summary = enforcer.get_scope_summary()

    assert summary["status"] == "GUARDRAILS_ACTIVE"
    assert summary["total_domains"] <= 20
    assert summary["total_hosts"] <= 10
    assert summary["caps"]["max_domains"] == 20
    assert summary["caps"]["max_hosts"] == 10
    assert 22 in summary["permitted_ports"]
    assert 443 in summary["permitted_ports"]
    assert 8080 in summary["permitted_ports"]


def test_target_approval_check():
    enforcer = ScopeSafetyEnforcer()

    # Approved targets
    approved, msg = enforcer.is_target_approved("aiori.lab")
    assert approved is True
    assert "Approved domain" in msg

    approved, msg = enforcer.is_target_approved("10.0.1.10")
    assert approved is True

    # Out of scope target
    approved, msg = enforcer.is_target_approved("unauthorized.external.com")
    assert approved is False
    assert "NOT in approved scope" in msg


def test_permitted_ports():
    enforcer = ScopeSafetyEnforcer()
    assert enforcer.is_port_permitted(22) is True
    assert enforcer.is_port_permitted(443) is True
    assert enforcer.is_port_permitted(8080) is True
    assert enforcer.is_port_permitted(4444) is False
    assert enforcer.is_port_permitted(3389) is False
