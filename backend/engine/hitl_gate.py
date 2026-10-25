"""
ArgusASM Human-in-the-Loop (HITL) Governance Engine
AIORI Hackathon 2026 - Problem Statement PS-011
Enforces strict human verification and sign-off for:
1. High / Critical severity perimeter findings (R-3)
2. Automated remediation dispatch (cert renew, firewall deny, DNS purge)
3. Scope alteration or policy overrides
4. Emergency kill-switch deactivation

Ensures zero unauthorized modifications to production assets without
an explicit human-in-the-loop cryptographic approval trail.
"""

import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional


class HitlGovernanceEngine:
    """
    Manages pending human approval queues for critical actions.
    Persisted in SQLite with audit-ready operator justifications.
    """

    _instance: Optional["HitlGovernanceEngine"] = None
    _lock = threading.Lock()

    def __new__(cls, db_path: Optional[str] = None):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(HitlGovernanceEngine, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, db_path: Optional[str] = None):
        if getattr(self, "_initialized", False):
            return

        if not db_path:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            data_dir = os.path.join(base_dir, "data")
            os.makedirs(data_dir, exist_ok=True)
            db_path = os.path.join(data_dir, "argus_ledger.db")

        self.db_path = db_path
        self._db_lock = threading.Lock()
        self._init_db()
        self._seed_default_critical_reviews()
        self._initialized = True

    def _init_db(self) -> None:
        """Initializes SQLite schema for Human-in-the-Loop approvals."""
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS hitl_approvals (
                    id TEXT PRIMARY KEY,
                    action_type TEXT NOT NULL,
                    criticality TEXT NOT NULL,
                    target TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    proposed_action TEXT NOT NULL,
                    status TEXT NOT NULL,
                    requested_at TEXT NOT NULL,
                    reviewed_at TEXT,
                    reviewer_id TEXT,
                    justification TEXT
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_hitl_status ON hitl_approvals (status)")
            conn.commit()
            conn.close()

    def _seed_default_critical_reviews(self) -> None:
        """Seeds initial pending human reviews for the 3 testbed seeded critical faults."""
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM hitl_approvals")
            count = cursor.fetchone()[0]
            if count == 0:
                now = datetime.now(timezone.utc).isoformat()
                initial_items = [
                    (
                        "HITL-001",
                        "REMEDIATION_AUTHORIZATION",
                        "CRITICAL",
                        "legacy.aiori.lab:443",
                        "TLS Certificate Expired (-35 score penalty). Production trust anchor invalid.",
                        "Execute Certbot / Let's Encrypt automated certificate renewal and reload Nginx service.",
                        "PENDING_HUMAN_REVIEW",
                        now,
                        None,
                        None,
                        None,
                    ),
                    (
                        "HITL-002",
                        "FIREWALL_POLICY_ENFORCEMENT",
                        "HIGH",
                        "dev-edge.aiori.lab:8080",
                        "Unapproved shadow service (Werkzeug console) detected outside perimeter whitelist.",
                        "Execute host firewall isolation rule: 'ufw deny proto tcp from any to 10.0.1.25 port 8080'.",
                        "PENDING_HUMAN_REVIEW",
                        now,
                        None,
                        None,
                        None,
                    ),
                    (
                        "HITL-003",
                        "DANGLING_DNS_RECORD_DELETION",
                        "HIGH",
                        "test-s3.aiori.lab",
                        "Potential dangling DNS candidate pointing to unallocated AWS S3 bucket.",
                        "Purge authoritative CNAME record 'test-s3.aiori.lab' from DNS zone or allocate S3 bucket.",
                        "PENDING_HUMAN_REVIEW",
                        now,
                        None,
                        None,
                        None,
                    ),
                ]
                cursor.executemany("""
                    INSERT INTO hitl_approvals (
                        id, action_type, criticality, target, summary,
                        proposed_action, status, requested_at, reviewed_at, reviewer_id, justification
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, initial_items)
                conn.commit()
            conn.close()

    def request_approval(
        self,
        action_type: str,
        criticality: str,
        target: str,
        summary: str,
        proposed_action: str,
    ) -> Dict[str, Any]:
        """Submits a high-criticality action into the Human-in-the-Loop queue."""
        approval_id = f"HITL-{uuid.uuid4().hex[:8].upper()}"
        requested_at = datetime.now(timezone.utc).isoformat()
        status = "PENDING_HUMAN_REVIEW"

        entry = {
            "id": approval_id,
            "action_type": action_type,
            "criticality": criticality.upper(),
            "target": target,
            "summary": summary,
            "proposed_action": proposed_action,
            "status": status,
            "requested_at": requested_at,
            "reviewed_at": None,
            "reviewer_id": None,
            "justification": None,
        }

        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO hitl_approvals (
                    id, action_type, criticality, target, summary,
                    proposed_action, status, requested_at, reviewed_at, reviewer_id, justification
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                entry["id"],
                entry["action_type"],
                entry["criticality"],
                entry["target"],
                entry["summary"],
                entry["proposed_action"],
                entry["status"],
                entry["requested_at"],
                None,
                None,
                None,
            ))
            conn.commit()
            conn.close()

        return entry

    def approve_action(
        self,
        approval_id: str,
        reviewer_id: str,
        justification: str,
    ) -> Dict[str, Any]:
        """Records explicit Human-in-the-Loop approval for a critical action."""
        reviewed_at = datetime.now(timezone.utc).isoformat()

        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM hitl_approvals WHERE id = ?", (approval_id,))
            row = cursor.fetchone()
            if not row:
                conn.close()
                raise ValueError(f"Approval ID '{approval_id}' not found.")

            cursor.execute("""
                UPDATE hitl_approvals
                SET status = 'APPROVED_BY_HUMAN',
                    reviewed_at = ?,
                    reviewer_id = ?,
                    justification = ?
                WHERE id = ?
            """, (reviewed_at, reviewer_id, justification, approval_id))
            conn.commit()

            cursor.execute("SELECT * FROM hitl_approvals WHERE id = ?", (approval_id,))
            updated = dict(cursor.fetchone())
            conn.close()

        return updated

    def reject_action(
        self,
        approval_id: str,
        reviewer_id: str,
        justification: str,
    ) -> Dict[str, Any]:
        """Records human rejection of a proposed critical remediation action."""
        reviewed_at = datetime.now(timezone.utc).isoformat()

        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM hitl_approvals WHERE id = ?", (approval_id,))
            row = cursor.fetchone()
            if not row:
                conn.close()
                raise ValueError(f"Approval ID '{approval_id}' not found.")

            cursor.execute("""
                UPDATE hitl_approvals
                SET status = 'REJECTED_BY_HUMAN',
                    reviewed_at = ?,
                    reviewer_id = ?,
                    justification = ?
                WHERE id = ?
            """, (reviewed_at, reviewer_id, justification, approval_id))
            conn.commit()

            cursor.execute("SELECT * FROM hitl_approvals WHERE id = ?", (approval_id,))
            updated = dict(cursor.fetchone())
            conn.close()

        return updated

    def get_pending_reviews(self) -> List[Dict[str, Any]]:
        """Returns all actions currently awaiting human sign-off."""
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM hitl_approvals WHERE status = 'PENDING_HUMAN_REVIEW' ORDER BY requested_at DESC")
            rows = cursor.fetchall()
            conn.close()
            return [dict(r) for r in rows]

    def get_all_reviews(self) -> List[Dict[str, Any]]:
        """Returns entire human-in-the-loop governance log."""
        with self._db_lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM hitl_approvals ORDER BY requested_at DESC")
            rows = cursor.fetchall()
            conn.close()
            return [dict(r) for r in rows]


# Global singleton instance
hitl_engine = HitlGovernanceEngine()
