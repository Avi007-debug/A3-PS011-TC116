"""
ArgusASM Kill Switch (R-7)
AIORI Hackathon 2026 - Problem Statement PS-011
Thread-safe emergency stop mechanism.
Instantly terminates in-flight probe threads and blocks all scheduled runs.
"""

import threading
from datetime import datetime, timezone
from typing import Dict, Any, Optional


class KillSwitchError(RuntimeError):
    """Raised when an operation is attempted while the kill switch is active."""
    pass


class ArgusKillSwitch:
    """
    Singleton emergency kill switch ensuring immediate cessation of network probing.
    """

    _instance: Optional["ArgusKillSwitch"] = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ArgusKillSwitch, cls).__new__(cls)
                cls._instance._is_active = False
                cls._instance._activated_at = None
                cls._instance._activated_by = None
                cls._instance._reason = None
            return cls._instance

    def activate(self, reason: str = "Operator manual emergency shutdown", operator: str = "security_lead") -> Dict[str, Any]:
        """Activates emergency kill switch."""
        with self._lock:
            self._is_active = True
            self._activated_at = datetime.now(timezone.utc).isoformat()
            self._activated_by = operator
            self._reason = reason

        return self.get_status()

    def deactivate(self, operator: str = "security_lead") -> Dict[str, Any]:
        """Resets emergency kill switch after safety review."""
        with self._lock:
            self._is_active = False
            self._activated_at = None
            self._activated_by = None
            self._reason = None

        return self.get_status()

    def is_active(self) -> bool:
        """Returns True if probing is halted."""
        with self._lock:
            return self._is_active

    def check_or_abort(self) -> None:
        """Raises KillSwitchError if the kill switch is currently engaged."""
        with self._lock:
            if self._is_active:
                raise KillSwitchError(
                    f"ArgusASM Kill Switch ENGAGED: Probing blocked. Reason: {self._reason} (Activated by: {self._activated_by} at {self._activated_at})"
                )

    def get_status(self) -> Dict[str, Any]:
        """Returns current kill switch status for UI indicator and API."""
        with self._lock:
            return {
                "kill_switch_active": self._is_active,
                "status": "ENGAGED" if self._is_active else "NOMINAL",
                "activated_at": self._activated_at,
                "activated_by": self._activated_by,
                "reason": self._reason,
                "message": (
                    "PROBES HALTED: Emergency kill switch engaged. Zero outbound packets permitted."
                    if self._is_active
                    else "Operational: Probes authorized within approved scope."
                ),
            }


# Global singleton instance
kill_switch = ArgusKillSwitch()
