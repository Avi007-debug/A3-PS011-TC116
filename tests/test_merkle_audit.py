"""
Unit tests for ArgusASM Merkle Audit Trail Engine
"""

from backend.engine.merkle_audit import MerkleAuditLedger


def test_merkle_attestation_receipt():
    ledger = MerkleAuditLedger()
    receipt = ledger.generate_snapshot_receipt({
        "snapshot_id": "SNAP-T0-TEST",
        "snapshot_tag": "T0",
        "block_height": 100,
    })

    assert receipt["merkle_root"].startswith("0x")
    assert len(receipt["leaves"]) == 5
    assert len(receipt["intermediate_nodes"]) == 3
    assert receipt["attestation_status"] == "VERIFIED_TAMPER_FREE"


def test_deterministic_merkle_hashing():
    ledger = MerkleAuditLedger()
    h1 = ledger.hash_leaf("aiori.lab")
    h2 = ledger.hash_leaf("aiori.lab")
    assert h1 == h2

    combined_1 = ledger.combine_hashes(h1, h2)
    combined_2 = ledger.combine_hashes(h1, h2)
    assert combined_1 == combined_2
