/**
 * ArgusASM Backend Integration Service
 * Manages connection modes (Local Backend, Demo Fixtures, Live Security Testbed),
 * health polling, live telemetry, and authoritative scan dispatching.
 * AIORI Hackathon 2026 - Problem Statement PS-011
 */

import { LIVE_TELEMETRY, PROJECT } from "@/data/sentinel";

export type ConnectionMode = "local" | "demo" | "live";
export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

export interface SystemHealth {
  mode: ConnectionMode;
  status: ConnectionStatus;
  endpoint: string;
  latencyMs: number;
  lastChecked: string;
  errorMessage?: string;
  backendVersion?: string;
}

export interface LiveTelemetryData {
  status: string;
  scopeSummary: string;
  approvedDomainsCount: number;
  approvedHostsCount: number;
  driftStatus: string;
  activeChecksCount: number;
  hygieneScore: number;
  blockHeight: number;
  merkleRoot: string;
  timestamp: string;
  isSimulated: boolean;
}

export interface ScanResult {
  status: "COMPLETED" | "RUNNING" | "FAILED";
  targetsScanned: number;
  checksExecuted: string[];
  driftDetected: boolean;
  newFindingsCount: number;
  timestamp: string;
  merkleRoot?: string;
  isSimulated: boolean;
}

class BackendIntegrationService {
  private apiBaseUrl: string = ((typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : "http://localhost:8000").replace(/\/+$/, "");
  private currentMode: ConnectionMode = "demo";
  private currentStatus: ConnectionStatus = "connecting";
  private lastLatency: number = 0;
  private lastHealthCheck: string = new Date().toISOString();
  private listeners: Array<(health: SystemHealth) => void> = [];
  private checkIntervalId: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("argus_connection_mode") as ConnectionMode;
      if (savedMode === "local" || savedMode === "demo" || savedMode === "live") {
        this.currentMode = savedMode;
      }
      this.checkHealth();
      this.startHealthPolling();
    }
  }

  public subscribe(callback: (health: SystemHealth) => void): () => void {
    this.listeners.push(callback);
    callback(this.getHealth());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    const health = this.getHealth();
    this.listeners.forEach((cb) => cb(health));
  }

  public getHealth(): SystemHealth {
    return {
      mode: this.currentMode,
      status: this.currentStatus,
      endpoint: this.apiBaseUrl,
      latencyMs: this.lastLatency,
      lastChecked: this.lastHealthCheck,
    };
  }

  public setMode(mode: ConnectionMode) {
    this.currentMode = mode;
    if (typeof window !== "undefined") {
      localStorage.setItem("argus_connection_mode", mode);
    }
    this.checkHealth();
  }

  public async checkHealth(): Promise<boolean> {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${this.apiBaseUrl}/`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      this.lastLatency = Math.round(performance.now() - start);
      this.lastHealthCheck = new Date().toISOString();

      if (res.ok) {
        this.currentStatus = "connected";
        if (this.currentMode !== "live") {
          this.currentMode = "local";
        }
        this.notify();
        return true;
      } else {
        this.currentStatus = "error";
        this.currentMode = "demo";
        this.notify();
        return false;
      }
    } catch {
      this.lastLatency = Math.round(performance.now() - start);
      this.lastHealthCheck = new Date().toISOString();
      this.currentStatus = "disconnected";
      this.currentMode = "demo";
      this.notify();
      return false;
    }
  }

  private startHealthPolling() {
    if (this.checkIntervalId) clearInterval(this.checkIntervalId);
    this.checkIntervalId = setInterval(() => {
      this.checkHealth();
    }, 15000);
  }

  public async getTelemetry(): Promise<LiveTelemetryData> {
    if (this.currentStatus === "connected") {
      try {
        const res = await fetch(`${this.apiBaseUrl}/api/telemetry/live`);
        if (res.ok) {
          const data = await res.json();
          return {
            status: data.status ?? "ONLINE",
            scopeSummary: data.scope_summary ?? "SCOPE: 20 DOMAINS / 10 HOSTS",
            approvedDomainsCount: data.approved_domains_count ?? 15,
            approvedHostsCount: data.approved_hosts_count ?? 8,
            driftStatus: data.drift_status ?? "DRIFT DETECTED",
            activeChecksCount: data.active_checks_count ?? 4,
            hygieneScore: data.hygiene_score ?? 68,
            blockHeight: data.block_height ?? 1840291,
            merkleRoot: data.merkle_root ?? LIVE_TELEMETRY.merkleRoot,
            timestamp: data.timestamp ?? new Date().toISOString(),
            isSimulated: false,
          };
        }
      } catch {
        // Fall back to demo mode on network error
      }
    }

    // Deterministic Demo Fixture Data
    return {
      status: "ONLINE",
      scopeSummary: "SCOPE: 20 DOMAINS / 10 HOSTS",
      approvedDomainsCount: LIVE_TELEMETRY.approvedDomains,
      approvedHostsCount: LIVE_TELEMETRY.approvedHosts,
      driftStatus: "DRIFT DETECTED",
      activeChecksCount: 4,
      hygieneScore: 68,
      blockHeight: LIVE_TELEMETRY.blockHeight,
      merkleRoot: LIVE_TELEMETRY.merkleRoot,
      timestamp: new Date().toISOString(),
      isSimulated: true,
    };
  }

  public async runScan(scopeFile: string = "approved_scope.json"): Promise<ScanResult> {
    if (this.currentStatus === "connected") {
      try {
        const res = await fetch(`${this.apiBaseUrl}/api/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope_file: scopeFile }),
        });
        if (res.ok) {
          const data = await res.json();
          return {
            status: data.status,
            targetsScanned: data.targets_scanned,
            checksExecuted: data.checks_executed,
            driftDetected: data.drift_detected,
            newFindingsCount: data.new_findings_count,
            timestamp: data.timestamp,
            isSimulated: false,
          };
        }
      } catch {
        // Fall through to simulated scan
      }
    }

    // Simulated scan execution for demo mode
    await new Promise((resolve) => setTimeout(resolve, 1400));
    return {
      status: "COMPLETED",
      targetsScanned: 23,
      checksExecuted: ["DNS", "TLS", "PORTS", "DANGLING_DNS"],
      driftDetected: true,
      newFindingsCount: 3,
      timestamp: new Date().toISOString(),
      merkleRoot: LIVE_TELEMETRY.merkleRoot,
      isSimulated: true,
    };
  }

  public async getHygieneScore(): Promise<any> {
    if (this.currentStatus === "connected") {
      try {
        const res = await fetch(`${this.apiBaseUrl}/api/score`);
        if (res.ok) return await res.json();
      } catch {
        // Fall through
      }
    }
    return {
      hygiene_score: 68,
      rating: "ELEVATED_RISK",
      total_deductions: 3,
      is_simulated: true,
    };
  }

  public async getFindings(): Promise<any> {
    if (this.currentStatus === "connected") {
      try {
        const res = await fetch(`${this.apiBaseUrl}/api/findings`);
        if (res.ok) return await res.json();
      } catch {
        // Fall through
      }
    }
    return null;
  }
}

export const backendService = new BackendIntegrationService();
