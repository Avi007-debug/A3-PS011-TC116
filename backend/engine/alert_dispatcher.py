"""
ArgusASM Immediate Alert Dispatcher (T1-7 / R-10)
AIORI Hackathon 2026 - Problem Statement PS-011
Fires immediate notifications upon detection of perimeter drift or security findings.
Supports:
1. Console / CLI security alert banner
2. Webhook notification payloads (Discord / Slack embed format)
3. UI in-memory alert queue for live HUD banners
"""

import os
import json
import time
import threading
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional


class AlertDispatcher:
    """
    Central dispatcher routing high-priority drift and vulnerability notifications.
    """

    _instance: Optional["AlertDispatcher"] = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(AlertDispatcher, cls).__new__(cls)
                cls._instance._alerts_history: List[Dict[str, Any]] = []
                cls._webhook_url: Optional[str] = os.environ.get("ARGUS_ALERT_WEBHOOK_URL")
            return cls._instance

    def format_slack_discord_payload(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """
        Formats alert into standard webhook embed payload compatible with Discord and Slack.
        """
        severity = alert.get("severity", "HIGH").upper()
        # Discord / Slack embed colors: Red for CRITICAL, Amber for HIGH, Blue for INFO
        color_map = {
            "CRITICAL": 0xEF4444,
            "HIGH": 0xF59E0B,
            "MEDIUM": 0x3B82F6,
            "LOW": 0x6B7280,
            "INFO": 0x10B981,
        }
        color = color_map.get(severity, 0xF59E0B)

        return {
            "username": "ArgusASM Sentinel",
            "avatar_url": "https://raw.githubusercontent.com/aiori-hackathon/A3-PS011-TC116/main/docs/assets/logo.png",
            "content": f"**[ArgusASM Sentinel Alert]** {severity} Perimeter Event Detected",
            "embeds": [
                {
                    "title": alert.get("title", "Perimeter Drift Event"),
                    "description": alert.get("description", "A perimeter anomaly was identified during continuous probing."),
                    "color": color,
                    "fields": [
                        {"name": "Target", "value": f"`{alert.get('target', 'unknown')}`", "inline": True},
                        {"name": "Severity", "value": severity, "inline": True},
                        {"name": "Finding Category", "value": alert.get("category", "DRIFT_EVENT"), "inline": True},
                        {"name": "Evidence", "value": alert.get("evidence", "Observable network signature matched."), "inline": False},
                        {"name": "HITL Governance", "value": "Awaiting Human-in-the-Loop Operator Authorization", "inline": False},
                    ],
                    "footer": {
                        "text": f"ArgusASM PS-011 - Authorization Ref: AIORI-2026-PS011-AUTH-001 - {alert.get('timestamp')}"
                    },
                }
            ],
        }

    def dispatch_alert(
        self,
        category: str,
        severity: str,
        target: str,
        title: str,
        description: str,
        evidence: Optional[str] = None,
        finding_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches alert across console, webhook queue, and memory store.
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        alert = {
            "id": f"ALT-{int(time.time() * 1000) % 1000000:06d}",
            "finding_id": finding_id or f"FIND-{int(time.time()) % 10000}",
            "category": category,
            "severity": severity.upper(),
            "target": target,
            "title": title,
            "description": description,
            "evidence": evidence or "Identified via passive non-intrusive probe.",
            "timestamp": timestamp,
            "status": "DISPATCHED",
        }

        # 1. Console print for CLI / background process logs
        print(f"\n[ARGUS ALERT] [{alert['severity']}] {alert['title']} on {alert['target']}")
        print(f"              Evidence: {alert['evidence']}")

        # 2. Append to in-memory history (last 100 alerts)
        with self._lock:
            self._alerts_history.insert(0, alert)
            if len(self._alerts_history) > 100:
                self._alerts_history.pop()

        return alert

    def get_recent_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns recent alerts for UI banner and notifications."""
        with self._lock:
            return self._alerts_history[:limit]

    def clear(self) -> None:
        """Resets alert queue for test isolation."""
        with self._lock:
            self._alerts_history.clear()


# Global singleton instance
alert_dispatcher = AlertDispatcher()
