"""
ArgusASM Snapshot Engine (Tasks Section 2.3 / R-8)
AIORI Hackathon 2026 - Problem Statement PS-011
Writes versioned JSON snapshots (snapshots/T0.json, T1.json, T2.json) with:
- Scope-file SHA-256 (R-8)
- Timestamp & UUID
- Inventory assets & services
- Seeded & detected findings
- Perimeter Hygiene Score
- Cryptographic Merkle root chained to previous snapshot root
- SQLite index for rapid querying and time-travel replay
"""

import os
import json
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from backend.engine.scope_engine import ScopeSafetyEnforcer
from backend.engine.scoring_engine import PerimeterHygieneScorer
from backend.engine.merkle_audit import MerkleAuditLedger


class SnapshotEngine:
    """
    Manages generation, storage, and cryptographic indexing of perimeter snapshots.
    """

    def __init__(self, snapshots_dir: Optional[str] = None, db_path: Optional[str] = None):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

        if not snapshots_dir:
            snapshots_dir = os.path.join(base_dir, "snapshots")
        os.makedirs(snapshots_dir, exist_ok=True)
        self.snapshots_dir = snapshots_dir

        if not db_path:
            data_dir = os.path.join(base_dir, "data")
            os.makedirs(data_dir, exist_ok=True)
            db_path = os.path.join(data_dir, "argus_ledger.db")
        self.db_path = db_path

        self.scope = ScopeSafetyEnforcer()
        self.scorer = PerimeterHygieneScorer()
        self.merkle = MerkleAuditLedger()
        self._db_lock = threading.Lock()
        self._init_db()

    def _init_db(self) -> None:
        """Initializes SQLite schema for the snapshot index."""
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS snapshots (
                    snapshot_id TEXT PRIMARY KEY,
                    state_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    scope_sha256 TEXT NOT NULL,
                    hygiene_score INTEGER NOT NULL,
                    total_assets INTEGER NOT NULL,
                    total_findings INTEGER NOT NULL,
                    merkle_root TEXT NOT NULL,
                    previous_merkle_root TEXT,
                    file_path TEXT NOT NULL
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_snapshot_state ON snapshots (state_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_snapshot_time ON snapshots (timestamp DESC)")
            conn.commit()
            conn.close()

    def create_snapshot(
        self,
        state_id: str,
        assets: List[Dict[str, Any]],
        findings: List[Dict[str, Any]],
        previous_merkle_root: Optional[str] = None,
        custom_timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates and persists a versioned snapshot JSON with cryptographic Merkle root.
        """
        snapshot_id = f"SNAP-{state_id.upper()}"
        timestamp = custom_timestamp or datetime.now(timezone.utc).isoformat()

        # Compute Hygiene Score
        score_res = self.scorer.calculate_score(findings)
        hygiene_score = score_res["hygiene_score"]

        # Generate Merkle Root over canonical assets
        merkle_receipt = self.merkle.generate_snapshot_receipt({
            "snapshot_id": snapshot_id,
            "assets": assets,
            "findings": findings,
            "previous_root": previous_merkle_root or "0x0000000000000000000000000000000000000000000000000000000000000000",
        })
        merkle_root = merkle_receipt["merkle_root"]

        snapshot_data = {
            "snapshot_id": snapshot_id,
            "state_id": state_id.upper(),
            "timestamp": timestamp,
            "scope_sha256": self.scope.scope_sha256,
            "authorization_ref": self.scope.authorization_ref,
            "hygiene_score": hygiene_score,
            "hygiene_rating": score_res["rating"],
            "score_breakdown": score_res,
            "merkle_root": merkle_root,
            "previous_merkle_root": previous_merkle_root,
            "total_assets": len(assets),
            "total_findings": len(findings),
            "assets": assets,
            "findings": findings,
        }

        # Write to snapshots/{state_id}.json
        filename = f"{state_id.upper()}.json"
        file_path = os.path.join(self.snapshots_dir, filename)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(snapshot_data, f, indent=2)

        # Index in SQLite
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO snapshots (
                    snapshot_id, state_id, timestamp, scope_sha256, hygiene_score,
                    total_assets, total_findings, merkle_root, previous_merkle_root, file_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                snapshot_id,
                state_id.upper(),
                timestamp,
                self.scope.scope_sha256,
                hygiene_score,
                len(assets),
                len(findings),
                merkle_root,
                previous_merkle_root,
                file_path,
            ))
            conn.commit()
            conn.close()

        return snapshot_data

    def get_snapshot(self, snapshot_id_or_state: str) -> Optional[Dict[str, Any]]:
        """Retrieves snapshot from disk by ID or state (e.g. 'T0' or 'SNAP-T0')."""
        state = snapshot_id_or_state.replace("SNAP-", "").upper()
        filename = f"{state}.json"
        file_path = os.path.join(self.snapshots_dir, filename)

        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)

        return None

    def list_snapshots(self) -> List[Dict[str, Any]]:
        """Lists all snapshots indexed in SQLite."""
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM snapshots ORDER BY timestamp ASC")
            rows = cursor.fetchall()
            conn.close()
            return [dict(r) for r in rows]

    def seed_baseline_snapshots(self) -> None:
        """Seeds the standard T0, T1, and T2 snapshots if not yet present."""
        if os.path.exists(os.path.join(self.snapshots_dir, "T0.json")):
            return

        # Base assets
        base_assets = [
            {"domain": "aiori.lab", "ip": "10.0.1.10", "ports": [22, 80, 443], "status": "HEALTHY"},
            {"domain": "api.aiori.lab", "ip": "10.0.1.11", "ports": [80, 443], "status": "HEALTHY"},
            {"domain": "auth.aiori.lab", "ip": "10.0.1.12", "ports": [443], "status": "HEALTHY"},
            {"domain": "legacy.aiori.lab", "ip": "10.0.1.30", "ports": [443], "status": "HEALTHY"},
            {"domain": "dev-edge.aiori.lab", "ip": "10.0.1.25", "ports": [80, 443], "status": "HEALTHY"},
            {"domain": "test-s3.aiori.lab", "cname": "aiori-dormant.s3.amazonaws.com", "status": "HEALTHY"},
        ]

        # T0: Clean Baseline
        t0 = self.create_snapshot(
            state_id="T0",
            assets=base_assets,
            findings=[],
            previous_merkle_root="0x0000000000000000000000000000000000000000000000000000000000000000",
            custom_timestamp="2026-10-20T04:00:00Z",
        )

        # T1: 3 Seeds Injected
        t1_findings = [
            {"finding_id": "FIND-01", "category": "EXPIRED_TLS", "target": "legacy.aiori.lab", "severity": "CRITICAL"},
            {"finding_id": "FIND-02", "category": "UNEXPECTED_PORT", "target": "dev-edge.aiori.lab", "port": 8080, "severity": "HIGH"},
            {"finding_id": "FIND-03", "category": "DANGLING_DNS", "target": "test-s3.aiori.lab", "severity": "HIGH"},
        ]
        t1 = self.create_snapshot(
            state_id="T1",
            assets=base_assets,
            findings=t1_findings,
            previous_merkle_root=t0["merkle_root"],
            custom_timestamp="2026-10-20T04:30:00Z",
        )

        # T2: Remediated
        t2 = self.create_snapshot(
            state_id="T2",
            assets=base_assets,
            findings=[],
            previous_merkle_root=t1["merkle_root"],
            custom_timestamp="2026-10-20T05:00:00Z",
        )
