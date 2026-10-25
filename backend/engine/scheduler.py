"""
ArgusASM Automated Scan Scheduler (T1-8)
AIORI Hackathon 2026 - Problem Statement PS-011
Orchestrates recurring perimeter scans at configurable intervals.
Enforces kill-switch pre-flight checks and polite rate limiting.
"""

import time
import threading
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from backend.engine.kill_switch import ArgusKillSwitch
from backend.engine.orchestrator import ProbeOrchestrator


class ArgusScheduler:
    """
    Background worker managing scheduled passive inventory scans.
    """

    _instance: Optional["ArgusScheduler"] = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ArgusScheduler, cls).__new__(cls)
                cls._instance._is_running = False
                cls._instance._interval_seconds = 300  # Default: 5 minutes
                cls._instance._thread = None
                cls._instance._last_scan_time = None
                cls._instance._total_scheduled_runs = 0
                cls._instance._orchestrator = ProbeOrchestrator()
                cls._instance._kill_switch = ArgusKillSwitch()
            return cls._instance

    def _run_loop(self) -> None:
        """Internal background loop running periodic scans."""
        while self._is_running:
            try:
                # Check kill switch before every scheduled cycle
                if not self._kill_switch.is_active():
                    self._orchestrator.scan_all_approved()
                    self._last_scan_time = datetime.now(timezone.utc).isoformat()
                    self._total_scheduled_runs += 1
            except Exception as e:
                print(f"[ARGUS SCHEDULER ERROR] {str(e)}")

            # Sleep in 1-second slices so stop() responds immediately
            for _ in range(self._interval_seconds):
                if not self._is_running:
                    break
                time.sleep(1)

    def start(self, interval_seconds: Optional[int] = None) -> Dict[str, Any]:
        """Starts background scheduler thread."""
        with self._lock:
            if interval_seconds:
                self._interval_seconds = max(10, interval_seconds)

            if not self._is_running:
                self._is_running = True
                self._thread = threading.Thread(target=self._run_loop, daemon=True)
                self._thread.start()

        return self.get_status()

    def stop(self) -> Dict[str, Any]:
        """Stops background scheduler thread."""
        with self._lock:
            self._is_running = False

        return self.get_status()

    def trigger_now(self) -> Dict[str, Any]:
        """Executes an immediate out-of-band scan cycle."""
        if self._kill_switch.is_active():
            return {
                "status": "BLOCKED",
                "message": "Scan rejected: Emergency kill switch is engaged.",
            }

        res = self._orchestrator.scan_all_approved()
        self._last_scan_time = datetime.now(timezone.utc).isoformat()
        with self._lock:
            self._total_scheduled_runs += 1

        return {
            "status": "TRIGGERED_SUCCESSFULLY",
            "last_scan_time": self._last_scan_time,
            "scan_results": res,
        }

    def get_status(self) -> Dict[str, Any]:
        """Returns scheduler operational status for UI telemetry and API."""
        with self._lock:
            return {
                "scheduler_active": self._is_running,
                "interval_seconds": self._interval_seconds,
                "last_scan_time": self._last_scan_time,
                "total_completed_runs": self._total_scheduled_runs,
                "kill_switch_active": self._kill_switch.is_active(),
                "mode": "DEMO_INTERVAL (30s)" if self._interval_seconds <= 30 else "PRODUCTION_INTERVAL (300s)",
            }


# Global singleton instance
argus_scheduler = ArgusScheduler()
