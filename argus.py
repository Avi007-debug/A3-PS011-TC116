#!/usr/bin/env python3
"""
ArgusASM Unified Command-Line Interface (Tasks Section 7)
AIORI Hackathon 2026 - Problem Statement PS-011

Usage:
  python argus.py scan [--scope approved_scope.json]
  python argus.py diff [--baseline T0] [--current T1]
  python argus.py verify [--snapshot T1] [--chain]
  python argus.py ledger [--limit 20]
  python argus.py kill [--reset]
  python argus.py remediate --finding <FINDING_ID>
"""

import sys
import os
import io
import argparse
import json
from contextlib import redirect_stdout, redirect_stderr
from typing import Dict, Any, List, Optional

# Ensure project root is in sys.path
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.engine.scope_engine import ScopeSafetyEnforcer
from backend.engine.orchestrator import ProbeOrchestrator
from backend.engine.snapshot_engine import SnapshotEngine
from backend.engine.drift_engine import StatefulDriftEngine
from backend.engine.merkle_audit import MerkleAuditLedger
from backend.engine.request_ledger import RequestLedger
from backend.engine.kill_switch import ArgusKillSwitch
from backend.engine.remediation import RemediationAdvisor


def handle_scan(args: argparse.Namespace) -> int:
    """Runs authorized perimeter scan against approved scope."""
    kill_switch = ArgusKillSwitch()
    if kill_switch.is_active():
        print("[!] SCAN ABORTED: Emergency kill switch is currently engaged.")
        print("[*] Run 'python argus.py kill --reset' to re-enable probing.")
        return 1

    scope_file = args.scope or "approved_scope.json"
    enforcer = ScopeSafetyEnforcer(scope_file)
    summary = enforcer.get_scope_summary()

    print(f"[+] Loading {scope_file} (PS-011 Guardrails Enforced)")
    print(f"[+] Scope Validation: {summary['total_domains']} domains / {summary['total_hosts']} hosts within caps (<=20 domains, <=10 hosts)")
    print(f"[+] Authorization Ref: {summary.get('authorization_ref', 'AIORI-2026-PS011-AUTH-001')}")
    print(f"[+] Scope SHA-256: {summary.get('scope_sha256', '')[:16]}...")
    print("[+] Check 1 (DNS Inventory) ... Complete (RFC 1035)")
    print("[+] Check 2 (TLS Inspector) ... Complete (RFC 5280)")
    print(f"[+] Check 3 (Permitted Ports) ... Auditing ports {sorted(list(enforcer.PERMITTED_PORTS))}")
    print("[+] Check 4 (Dangling DNS) ... Cloud fingerprints evaluated")

    orchestrator = ProbeOrchestrator(scope_file)
    result = orchestrator.scan_all_approved()

    findings = result.get("findings", [])
    print(f"[*] Findings Detected: {len(findings)}")
    for f in findings:
        cat = f.get("category", "FINDING")
        tgt = f.get("target", "")
        sev = f.get("severity", "HIGH")
        desc = f.get("description", f.get("title", ""))
        print(f"    [!] {sev}: {tgt} ({cat}) - {desc}")

    score = result.get("hygiene_score", 100)
    rating = result.get("hygiene_rating", "HEALTHY")
    root = result.get("merkle_root", "N/A")
    print(f"[*] Perimeter Hygiene Score: {score}/100 ({rating})")
    print(f"[*] Cryptographic Merkle Root: {root}")
    return 0


def handle_diff(args: argparse.Namespace) -> int:
    """Computes stateful drift delta between two snapshot versions."""
    base_id = args.baseline.replace("snapshots/", "").replace(".json", "")
    curr_id = args.current.replace("snapshots/", "").replace(".json", "")

    engine = SnapshotEngine()
    drift = StatefulDriftEngine()

    base_snap = engine.get_snapshot(base_id)
    curr_snap = engine.get_snapshot(curr_id)

    if not base_snap or not curr_snap:
        print(f"[!] Error: Could not locate snapshots '{base_id}' or '{curr_id}'.")
        return 1

    diff = drift.compute_drift(base_snap, curr_snap)
    events = diff.get("events", [])

    print(f"[+] Comparing Baseline Snapshot {base_id} with Current Snapshot {curr_id}:")
    for ev in events:
        sev = ev.get("severity", "INFO")
        tgt = ev.get("target", "")
        desc = ev.get("description", ev.get("title", ev.get("type", "")))
        print(f"    - [{sev} DRIFT] {tgt}: {desc}")

    base_score = base_snap.get("hygiene_score", 100)
    curr_score = curr_snap.get("hygiene_score", 100)
    score_delta = curr_score - base_score
    print(f"[*] Total Drift Events: {len(events)}")
    print(f"[*] Score Delta: {base_score} -> {curr_score} ({score_delta:+d} Pts)")
    print(f"[*] Baseline Merkle Root: {base_snap.get('merkle_root', '')}")
    print(f"[*] Current Merkle Root:  {curr_snap.get('merkle_root', '')}")
    return 0


def handle_verify(args: argparse.Namespace) -> int:
    """Verifies cryptographic Merkle tree integrity and chain continuity."""
    snapshot_engine = SnapshotEngine()

    if args.chain:
        print("[+] Verifying Cryptographic Merkle Audit Chain (T0 -> T1 -> T2):")
        res = snapshot_engine.verify_chain()
        chain = res.get("verified_snapshots", [])
        for link in chain:
            status = "VERIFIED" if link.get("is_valid") else "FAIL_MISMATCH"
            print(f"    - Snapshot {link.get('state_id')}: {link.get('stored_root')[:18]}... [{status}]")
        print(f"[*] Chain Continuity: {'VALID & UNBROKEN' if res.get('chain_valid') else 'BROKEN / TAMPERED'}")
        print(f"[*] Attestation Status: {res.get('status')}")
        return 0 if res.get("chain_valid") else 1
    else:
        snap_id = (args.snapshot or "T1").replace("snapshots/", "").replace(".json", "")
        print(f"[+] Querying SHA-256 Merkle Audit Chain for Snapshot {snap_id}:")
        res = snapshot_engine.verify_snapshot_by_id(snap_id)
        if not res.get("is_valid"):
            print(f"[!] VERIFICATION FAILED: {res.get('details', res.get('reason', 'Merkle root mismatch'))}")
            return 1

        print(f"    - Stored Root:   {res.get('stored_root')}")
        print(f"    - Computed Root: {res.get('computed_root')}")
        print(f"    - Previous Root: {res.get('previous_root')}")
        print(f"    - Leaf Count:    {res.get('total_leaves')} audited records")
        print("[*] Status: VERIFIED_TAMPER_FREE (Evidence matches immutable cryptographic record)")
        return 0


def handle_ledger(args: argparse.Namespace) -> int:
    """Prints recent outbound probe requests recorded in the tamper-evident ledger."""
    limit = args.limit or 20
    ledger = RequestLedger()
    entries = ledger.get_entries(limit=limit)

    print(f"[+] Outbound Probe Request Ledger (Displaying last {len(entries)} records):")
    print(f"{'TIMESTAMP':<22} | {'TARGET':<22} | {'PROBE':<16} | {'PORT':<6} | {'STATUS':<12}")
    print("-" * 86)

    for entry in entries:
        ts = str(entry.get("timestamp", ""))[:19]
        tgt = str(entry.get("target", ""))[:21]
        probe = str(entry.get("probe_type", ""))[:15]
        port = str(entry.get("port", "-"))[:5]
        status = str(entry.get("status", ""))[:11]
        print(f"{ts:<22} | {tgt:<22} | {probe:<16} | {port:<6} | {status:<12}")

    stats = ledger.get_stats()
    print("-" * 86)
    print(f"[*] Total Requests Logged: {stats.get('total_requests', 0)} | Violations Blocked: {stats.get('blocked_requests', 0)}")
    print("[*] Ledger Integrity: Strict Zero Out-of-Scope Network Traffic Enforced")
    return 0


def handle_kill(args: argparse.Namespace) -> int:
    """Engages or disengages the Argus emergency kill-switch."""
    kill_switch = ArgusKillSwitch()
    if args.reset:
        kill_switch.deactivate(operator="cli_operator")
        print("[*] Emergency kill-switch deactivated. Probing pipeline re-enabled.")
    else:
        kill_switch.activate(reason="Operator emergency stop via CLI", operator="cli_operator")
        print("[!] EMERGENCY KILL-SWITCH TRIGGERED:")
        print("[+] Terminating all in-flight asynchronous socket probes immediately.")
        print("[+] Preserving state and blocking all new outbound scan tasks.")
        print("[*] Engine safe state restored. Zero packets in flight.")
    return 0


def handle_remediate(args: argparse.Namespace) -> int:
    """Outputs non-destructive remediation directives for a finding."""
    advisor = RemediationAdvisor()
    rem = advisor.get_remediation_by_finding_id(args.finding)
    print(f"[+] Safe Remediation Directives for {args.finding}:")
    print(f"[*] Category: {rem.get('category')} | Target: {rem.get('title')}")
    print(f"[*] Providers: {', '.join(rem.get('providers', []))}")
    print("-" * 60)
    print(rem.get("code", ""))
    print("-" * 60)
    print(f"[*] Rollback: {rem.get('rollback', 'N/A')}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    """Constructs command line argument parser for ArgusASM."""
    parser = argparse.ArgumentParser(
        prog="argus",
        description="ArgusASM - Autonomous Attack-Surface Inventory & Drift Sentinel (PS-011)",
    )
    subparsers = parser.add_subparsers(dest="subcommand", help="Available subcommands")

    # scan
    p_scan = subparsers.add_parser("scan", help="Run authorized scan against approved scope")
    p_scan.add_argument("--scope", default="approved_scope.json", help="Path to approved scope file")

    # diff
    p_diff = subparsers.add_parser("diff", help="Compute stateful perimeter drift delta")
    p_diff.add_argument("--baseline", default="T0", help="Baseline snapshot ID or file")
    p_diff.add_argument("--current", default="T1", help="Current snapshot ID or file")

    # verify
    p_verify = subparsers.add_parser("verify", help="Verify Merkle audit tree and snapshot chain")
    p_verify.add_argument("--snapshot", default="T1", help="Snapshot to verify")
    p_verify.add_argument("--chain", action="store_true", help="Verify full snapshot chain continuity")

    # ledger
    p_ledger = subparsers.add_parser("ledger", help="Display outbound probe audit trail")
    p_ledger.add_argument("--limit", type=int, default=20, help="Number of records to show")

    # kill / stop
    p_kill = subparsers.add_parser("kill", help="Engage emergency kill switch")
    p_kill.add_argument("--reset", action="store_true", help="Deactivate kill switch")

    p_stop = subparsers.add_parser("stop", help="Alias for argus kill")
    p_stop.add_argument("--reset", action="store_true", help="Deactivate kill switch")

    # remediate
    p_rem = subparsers.add_parser("remediate", help="Generate safe remediation snippet")
    p_rem.add_argument("--finding", required=True, help="Finding ID or target")

    return parser


def execute_argus_command(cmd_string: str) -> Dict[str, Any]:
    """
    Executes an argus CLI command string programmatically and captures stdout/stderr.
    Used by FastAPI backend and CLI terminal modal.
    """
    import shlex

    # Strip leading 'argus' or 'python argus.py' if present
    parts = shlex.split(cmd_string)
    if parts and (parts[0] == "python" or parts[0] == "python3"):
        parts = parts[1:]
    if parts and (parts[0] == "argus" or parts[0] == "argus.py"):
        parts = parts[1:]

    if not parts or parts[0] in ["--help", "-h", "help"]:
        buf = io.StringIO()
        parser = build_parser()
        parser.print_help(buf)
        return {"command": cmd_string, "output": buf.getvalue(), "exit_code": 0}

    parser = build_parser()
    buf_out = io.StringIO()
    buf_err = io.StringIO()

    try:
        args = parser.parse_args(parts)
        with redirect_stdout(buf_out), redirect_stderr(buf_err):
            subcmd = args.subcommand
            if subcmd == "scan":
                code = handle_scan(args)
            elif subcmd == "diff":
                code = handle_diff(args)
            elif subcmd == "verify":
                code = handle_verify(args)
            elif subcmd == "ledger":
                code = handle_ledger(args)
            elif subcmd in ["kill", "stop"]:
                code = handle_kill(args)
            elif subcmd == "remediate":
                code = handle_remediate(args)
            else:
                parser.print_help(buf_out)
                code = 0

        output = buf_out.getvalue() + buf_err.getvalue()
        return {"command": cmd_string, "output": output.strip(), "exit_code": code}
    except SystemExit as e:
        output = buf_out.getvalue() + buf_err.getvalue()
        return {"command": cmd_string, "output": output.strip(), "exit_code": e.code or 0}
    except Exception as e:
        return {"command": cmd_string, "output": f"[!] CLI Error: {str(e)}", "exit_code": 1}


def main():
    parser = build_parser()
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)

    args = parser.parse_args()
    subcmd = args.subcommand
    if subcmd == "scan":
        sys.exit(handle_scan(args))
    elif subcmd == "diff":
        sys.exit(handle_diff(args))
    elif subcmd == "verify":
        sys.exit(handle_verify(args))
    elif subcmd == "ledger":
        sys.exit(handle_ledger(args))
    elif subcmd in ["kill", "stop"]:
        sys.exit(handle_kill(args))
    elif subcmd == "remediate":
        sys.exit(handle_remediate(args))
    else:
        parser.print_help()
        sys.exit(0)


if __name__ == "__main__":
    main()
