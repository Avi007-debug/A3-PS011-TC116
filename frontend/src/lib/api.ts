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
