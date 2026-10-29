"""
Unit tests for ArgusASM Cryptographic Merkle Audit Trail Engine (Section 5)
AIORI Hackathon 2026 - Problem Statement PS-011
Tests:
- Canonical JSON serialization and whitespace invariance (RFC 8785)
- Deterministic pairwise binary Merkle tree hashing
- Attestation receipt generation
- Single snapshot tamper verification
- Chain verification across T0 -> T1 -> T2
- Tamper detection: altering a single field in T0 breaks T0 and downstream chain integrity
"""

import copy
from backend.engine.merkle_audit import MerkleAuditLedger
from backend.engine.snapshot_engine import SnapshotEngine


def test_merkle_attestation_receipt():
    ledger = MerkleAuditLedger()
    receipt = ledger.generate_snapshot_receipt({
        "snapshot_id": "SNAP-T0-TEST",
        "snapshot_tag": "T0",
        "block_height": 100,
    })

    assert receipt["merkle_root"].startswith("0x")
    assert len(receipt["leaves"]) == 5
    assert len(receipt["intermediate_nodes"]) >= 1
    assert receipt["attestation_status"] == "VERIFIED_TAMPER_FREE"


def test_deterministic_merkle_hashing():
    ledger = MerkleAuditLedger()
    h1 = ledger.hash_leaf("aiori.lab")
    h2 = ledger.hash_leaf("aiori.lab")
    assert h1 == h2

    combined_1 = ledger.combine_hashes(h1, h2)
    combined_2 = ledger.combine_hashes(h1, h2)
    assert combined_1 == combined_2


def test_canonical_serialization_order_invariance():
    """Verify that different key insertion orders yield identical canonical strings and hashes."""
    ledger = MerkleAuditLedger()

    record_a = {"domain": "api.aiori.lab", "ip": "10.0.1.11", "ports": [80, 443], "status": "HEALTHY"}
    record_b = {"status": "HEALTHY", "ports": [80, 443], "domain": "api.aiori.lab", "ip": "10.0.1.11"}

    canon_a = ledger.canonicalize_record(record_a)
    canon_b = ledger.canonicalize_record(record_b)
    assert canon_a == canon_b
    assert " " not in canon_a  # zero whitespace

    hash_a = ledger.hash_leaf(record_a)
    hash_b = ledger.hash_leaf(record_b)
    assert hash_a == hash_b


def test_snapshot_canonical_verification():
    """Verify that valid snapshots pass cryptographic verification."""
    engine = SnapshotEngine()
    engine.seed_baseline_snapshots(force=True)

    t0_snap = engine.get_snapshot("T0")
    assert t0_snap is not None

    verification = engine.verify_snapshot_by_id("T0")
    assert verification["is_valid"] is True
    assert verification["status"] == "VERIFIED_TAMPER_FREE"
    assert verification["stored_root"] == verification["computed_root"]


def test_tamper_detection_in_single_snapshot():
    """Verify that altering a single character in an asset record triggers TAMPER_DETECTED."""
    ledger = MerkleAuditLedger()
    engine = SnapshotEngine()

    t0_snap = engine.get_snapshot("T0")
    tampered_snap = copy.deepcopy(t0_snap)

    # Tamper with an asset property (e.g. change an IP address)
    tampered_snap["assets"][0]["ip"] = "10.0.1.99"

    verification = ledger.verify_snapshot(tampered_snap)
    assert verification["is_valid"] is False
    assert verification["status"] == "TAMPER_DETECTED"
    assert verification["stored_root"] != verification["computed_root"]


def test_tamper_detection_breaks_entire_chain():
    """
    Tasks Section 5 Core Test:
    Editing one field in T0 makes verify fail for T0 and breaks chain verification
    for all subsequent snapshots (T1 and T2).
    """
    ledger = MerkleAuditLedger()
    engine = SnapshotEngine()
    engine.seed_baseline_snapshots(force=True)

    t0 = engine.get_snapshot("T0")
    t1 = engine.get_snapshot("T1")
    t2 = engine.get_snapshot("T2")

    # 1. Clean chain verification passes
    clean_chain = ledger.verify_chain([t0, t1, t2])
    assert clean_chain["chain_valid"] is True
    assert clean_chain["status"] == "VERIFIED_TAMPER_FREE"

    # 2. Tamper with a single field in T0
    tampered_t0 = copy.deepcopy(t0)
    tampered_t0["assets"][0]["status"] = "COMPROMISED"

    # T0 verification fails
    t0_verify = ledger.verify_snapshot(tampered_t0)
    assert t0_verify["is_valid"] is False
    assert t0_verify["status"] == "TAMPER_DETECTED"

    # 3. Chain verification over [tampered_t0, t1, t2] must fail
    broken_chain = ledger.verify_chain([tampered_t0, t1, t2])
    assert broken_chain["chain_valid"] is False
    assert broken_chain["status"] == "CHAIN_INTEGRITY_BROKEN"
    assert broken_chain["broken_link"] is not None
    assert broken_chain["broken_link"]["step"] == 0

    # 4. If attacker also rewrites T0's root to match the tamper, T1's link breaks!
    t0_recomputed_receipt = ledger.generate_snapshot_receipt(tampered_t0)
    tampered_t0_fake_root = copy.deepcopy(tampered_t0)
    tampered_t0_fake_root["merkle_root"] = t0_recomputed_receipt["merkle_root"]

    # Now tampered_t0 matches internally, but T1's previous_merkle_root does NOT match!
    broken_chain_at_t1 = ledger.verify_chain([tampered_t0_fake_root, t1, t2])
    assert broken_chain_at_t1["chain_valid"] is False
    assert broken_chain_at_t1["status"] == "CHAIN_INTEGRITY_BROKEN"
    assert broken_chain_at_t1["broken_link"]["step"] == 1
    assert "Broken chain link" in broken_chain_at_t1["broken_link"]["reason"]
