"""
ArgusASM Cross-Platform Testbed Scenario Controller
Controls perimeter drift states (T0 Baseline, T1 Drift, T2 Remediated)
Works seamlessly across Windows, macOS, and Linux.
"""

import sys
import os
import json
import argparse
from datetime import datetime, timezone

STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "active_state.json")

SCENARIOS = {
    "T0": {
        "name": "T0 Clean Baseline",
        "timestamp": "2026-10-20T04:00:00Z",
        "description": "Clean perimeter: all certificates valid, no unapproved service ports, zero dangling CNAMEs.",
        "seeds_active": [],
        "expected_score": 96,
        "seeds": {
            "legacy.aiori.lab": {"expired_cert": False, "valid_until": "2027-01-01T00:00:00Z"},
            "dev-edge.aiori.lab": {"port_8080_open": False},
            "test-s3.aiori.lab": {"dangling_s3": False, "cname": "api.aiori.lab"}
        }
    },
    "T1": {
        "name": "T1 Drifted State (3 Seeds Injected)",
        "timestamp": "2026-10-20T04:30:00Z",
        "description": "Stateful drift: 1 expired certificate, 1 unapproved open port (8080), 1 dangling S3 CNAME.",
        "seeds_active": ["TEST-SEED-01", "TEST-SEED-02", "TEST-SEED-03"],
        "expected_score": 68,
        "seeds": {
            "legacy.aiori.lab": {"expired_cert": True, "valid_until": "2026-01-01T00:00:00Z"},
            "dev-edge.aiori.lab": {"port_8080_open": True, "service": "Werkzeug/2.3.8 debug console"},
            "test-s3.aiori.lab": {"dangling_s3": True, "cname": "aiori-dormant-bucket.s3.amazonaws.com"}
        }
    },
    "T2": {
        "name": "T2 Remediated State",
        "timestamp": "2026-10-20T05:00:00Z",
        "description": "Safe remediation applied: renewed certificate, closed port 8080, deleted orphaned CNAME.",
        "seeds_active": [],
        "expected_score": 96,
        "seeds": {
            "legacy.aiori.lab": {"expired_cert": False, "valid_until": "2027-08-01T00:00:00Z"},
            "dev-edge.aiori.lab": {"port_8080_open": False, "firewall_status": "DENIED (UFW)"},
            "test-s3.aiori.lab": {"dangling_s3": False, "cname_deleted": True}
        }
    }
}

def get_current_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return SCENARIOS["T1"]  # Default to T1 drift state

def set_state(state_key: str):
    state_key = state_key.upper().strip()
    if state_key not in SCENARIOS:
        print(f"[-] Invalid scenario state '{state_key}'. Available: T0, T1, T2")
        sys.exit(1)

    scenario_data = SCENARIOS[state_key].copy()
    scenario_data["applied_at"] = datetime.now(timezone.utc).isoformat()
    scenario_data["state_id"] = state_key

    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(scenario_data, f, indent=2)

    print(f"[+] Successfully applied scenario [{state_key}]: {scenario_data['name']}")
    print(f"    Expected Hygiene Score: {scenario_data['expected_score']}/100")
    print(f"    Active Seeded Faults: {', '.join(scenario_data['seeds_active']) or 'None (Clean)'}")

def main():
    parser = argparse.ArgumentParser(description="ArgusASM Testbed Scenario Controller")
    parser.add_argument("--state", choices=["T0", "T1", "T2"], help="Set active scenario state")
    parser.add_argument("--status", action="store_true", help="Print current active scenario state")
    args = parser.parse_args()

    if args.state:
        set_state(args.state)
    elif args.status:
        curr = get_current_state()
        print(f"Active Scenario: {curr.get('state_id', 'T1')} ({curr.get('name', 'Unknown')})")
        print(f"Expected Score: {curr.get('expected_score')}/100")
        print(f"Active Seeds: {curr.get('seeds_active', [])}")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
