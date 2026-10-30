/**
 * ArgusASM Frontend API Client
 * Connects to the FastAPI backend with offline fallback support.
 * AIORI Hackathon 2026 · Problem Statement PS-011
 */

const API_BASE_URL = "http://localhost:8000";

export async function fetchTelemetry() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/telemetry/live`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function fetchApprovedScope() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/scope`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function fetchAssetInventory() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/inventory`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function fetchDriftDiff() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/diff`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function fetchFindings() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/findings`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function fetchHygieneScore() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/score`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function fetchLedgerReceipt() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ledger/receipt`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function triggerScan(scopeFile: string = "approved_scope.json") {
  try {
    const res = await fetch(`${API_BASE_URL}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope_file: scopeFile }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function simulateRemediation(category: string, target: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/simulate/remediation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, target }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function verifySnapshot(snapshotId: string = "T1") {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/verify/${snapshotId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function verifyChain() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/verify/chain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function acknowledgeFinding(
  findingId: string,
  action: "accept" | "false_positive",
  reason: string,
  reviewer: string = "operator"
) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/findings/${encodeURIComponent(findingId)}/ack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason, reviewer }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function fetchAcknowledgedFindings() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/findings/acknowledged`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function fetchFpCalibrationSummary() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/fp/calibration`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function unacknowledgeFinding(findingId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/findings/${encodeURIComponent(findingId)}/ack`, {
      method: "DELETE",
    });
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function fetchSnapshotGraph(snapshotId: string = "T1") {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/graph/${encodeURIComponent(snapshotId)}`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function fetchRemediation(findingId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/remediation/${encodeURIComponent(findingId)}`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function executeCli(command: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/cli/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}


export async function fetchSarifExport() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/export/sarif`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export function getExecutiveReportUrl(): string {
  return `${API_BASE_URL}/api/v1/export/executive-report`;
}

export async function fetchSimulationState() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/simulation/state`);
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export async function switchSimulationScenario(stateKey: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/simulation/switch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: stateKey }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Graceful offline fallback
  }
  return null;
}
