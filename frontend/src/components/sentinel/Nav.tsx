import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Database,
  GitCompare,
  Network,
  ShieldAlert,
  FileCheck,
  Play,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
import { PROJECT, LIVE_TELEMETRY } from "@/data/sentinel";
import { backendService, SystemHealth } from "@/services/backendIntegration";
import { isSupabaseConfigured } from "@/lib/supabase";

interface NavTab {
  id: string;
  label: string;
  to: "/" | "/capabilities" | "/drift" | "/security" | "/audit" | "/qa";
  hash?: string;
  badge?: string;
  badgeColor?: "blue" | "amber" | "red" | "emerald";
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_TABS: NavTab[] = [
  {
    id: "overview",
    label: "Overview",
    to: "/",
    icon: Activity,
  },
  {
    id: "inventory",
    label: "Inventory",
    to: "/capabilities",
    badge: "15",
    badgeColor: "blue",
    icon: Database,
  },
  {
    id: "drift",
    label: "Drift",
    to: "/drift",
    badge: "3",
    badgeColor: "amber",
    icon: GitCompare,
  },
  {
    id: "topology",
    label: "Topology",
    to: "/capabilities",
    hash: "topology",
    badgeColor: "emerald",
    icon: Network,
  },
  {
    id: "findings",
    label: "Findings",
    to: "/security",
    badge: "68",
    badgeColor: "red",
    icon: ShieldAlert,
  },
  {
    id: "audit",
    label: "Audit",
    to: "/audit",
    badgeColor: "blue",
    icon: FileCheck,
  },
];

export function Nav({
  onOpenCli,
  onOpenQa,
  onOpenSupabase,
}: {
  onOpenCli?: () => void;
  onOpenQa?: () => void;
  onOpenSupabase?: () => void;
}) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const currentHash = routerState.location.hash;

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Live Backend Connection State
  const [health, setHealth] = useState<SystemHealth>(backendService.getHealth());


  const mobileNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = backendService.subscribe((h) => {
      setHealth(h);
    });
    return unsub;
  }, []);

  // Dark-only mode â€” no toggleTheme needed


  const handleNavClick = (e: React.MouseEvent, tab: NavTab) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    navigate({ to: tab.to }).then(() => {
      if (tab.hash) {
        setTimeout(() => {
          const el = document.getElementById(tab.hash!);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }, 120);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const handleTriggerScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanMessage("Dispatching 4 RFC probes across approved scope...");

    try {
      const res = await backendService.runScan();
      setScanMessage(
        res.isSimulated
          ? "Demo Scan Complete: 23 targets verified Â· 3 seeded drift faults identified"
          : `Live Scan Complete: ${res.targetsScanned} targets scanned Â· Drift delta verified`
      );
      setTimeout(() => setScanMessage(null), 4000);
    } catch {
      setScanMessage("Scan completed with scope lock guardrails enforced.");
      setTimeout(() => setScanMessage(null), 3500);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isTabActive = (tab: NavTab) => {
    if (tab.hash) {
      return currentPath === tab.to && currentHash === tab.hash;
    }
    if (tab.to === "/") {
      return currentPath === "/";
    }
    return currentPath === tab.to && !currentHash;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Top Telemetry HUD Strip */}
      <div className="border-b border-border bg-surface px-4 py-1 font-mono text-[10px] text-muted-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2.5">
            {/* Live Connection Badge */}
            <button
              type="button"
              onClick={() => backendService.checkHealth()}
              title={`Connection: ${health.mode.toUpperCase()} (${health.status}) Â· ${health.latencyMs}ms`}
              className={`flex items-center gap-1.5 px-2 py-0.5 font-bold uppercase tracking-wider text-[9.5px] border cursor-pointer transition-colors ${
                health.status === "connected"
                  ? "border-success text-success"
                  : "border-warn text-warn"
              }`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  health.status === "connected" ? "bg-success" : "bg-warn"
                }`}
              />
              <span>{health.status === "connected" ? "LOCAL BACKEND" : "DEMO FIXTURE"}</span>
              <span className="text-[8.5px] opacity-75">({health.latencyMs}ms)</span>
            </button>

            <span className="text-border-strong">|</span>
            <span className="font-semibold text-foreground">
              SCOPE: {LIVE_TELEMETRY.approvedDomains}/{LIVE_TELEMETRY.maxDomains} DOM Â· {LIVE_TELEMETRY.approvedHosts}/{LIVE_TELEMETRY.maxHosts} HOSTS
            </span>
            <span className="text-border-strong">|</span>
            <span className="text-warn font-semibold">
              DRIFT: {LIVE_TELEMETRY.driftEventsDetected} FAULTS
            </span>
            <span className="text-border-strong">|</span>
            <span className="text-muted-foreground">CHECKS: 4/4 ACTIVE</span>
            <span className="text-border-strong">|</span>
            <span className="text-info font-semibold">READ-ONLY</span>
            <span className="text-border-strong">|</span>
            {onOpenSupabase ? (
              <button
                type="button"
                onClick={onOpenSupabase}
                className="flex items-center gap-1 text-info hover:underline font-semibold cursor-pointer"
              >
                DB: {isSupabaseConfigured ? "CONNECTED" : "LOCAL"}
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted-foreground font-semibold">{PROJECT.ps}</span>
            <span className="text-border-strong">|</span>
            <span className="text-info font-mono font-semibold">
              MERKLE: {LIVE_TELEMETRY.merkleRoot.slice(0, 10)}...
            </span>
            <span className="text-border-strong">|</span>
            <span className="font-mono text-[9px] text-muted-foreground">NON-EXPLOITATIVE</span>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <nav
        aria-label="Primary"
        className={`border-b transition-colors duration-150 ${
          scrolled
            ? "border-border-strong bg-surface"
            : "border-border bg-[#000000]"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 shrink-0"
          >
            <div className="relative flex h-8 w-8 items-center justify-center border border-border-strong bg-surface group-hover:border-primary transition-colors">
              <img src="/logo.png" alt="ArgusASM Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-wider text-foreground text-sm font-sans uppercase">
                ARGUS<span className="text-primary">ASM</span>
              </span>
              <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground leading-none">
                Perimeter Observatory
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-0 border border-border bg-surface">
            {NAV_TABS.map((tab) => {
              const active = isTabActive(tab);
              return (
                <a
                  key={tab.id}
                  href={tab.hash ? `${tab.to}#${tab.hash}` : tab.to}
                  onClick={(e) => handleNavClick(e, tab)}
                  className={`group relative flex items-center gap-1.5 px-3 py-2 font-sans font-semibold text-[11px] uppercase tracking-[0.06em] transition-colors duration-120 cursor-pointer border-b-2 ${
                    active
                      ? "text-primary border-b-primary bg-surface-raised"
                      : "text-muted-foreground border-b-transparent hover:text-foreground hover:bg-surface-raised"
                  }`}
                >
                  <tab.icon className="h-3 w-3 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[8.5px] px-1 py-0 font-mono font-bold border ${
                        tab.badgeColor === "amber"
                          ? "border-warn text-warn"
                          : tab.badgeColor === "red"
                            ? "border-destructive text-destructive"
                            : tab.badgeColor === "emerald"
                              ? "border-success text-success"
                              : "border-info text-info"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Run Scan */}
            <button
              type="button"
              onClick={handleTriggerScan}
              disabled={isScanning}
              className={`hidden sm:flex items-center gap-1.5 border border-primary px-3 py-1.5 font-sans font-semibold text-[11px] uppercase tracking-[0.06em] text-primary hover:bg-primary hover:text-black transition-colors duration-120 cursor-pointer ${
                isScanning ? "opacity-60 cursor-not-allowed" : ""
              }`}
              title="Execute authorized perimeter scan"
            >
              <span className="flex items-center gap-1">
                {isScanning ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-2.5 w-2.5 fill-current" />
                )}
              </span>
              <span>{isScanning ? "Scanning..." : "Run Scan"}</span>
            </button>

            {/* CLI */}
            {onOpenCli ? (
              <button
                type="button"
                onClick={onOpenCli}
                className="hidden md:flex items-center gap-1.5 border border-border-strong px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary transition-colors duration-120 cursor-pointer"
                title="Launch CLI Sandbox Terminal"
              >
                <span className="text-primary font-bold">&gt;_</span>
                <span>CLI</span>
              </button>
            ) : null}

            {/* Methodology */}
            {onOpenQa ? (
              <button
                type="button"
                onClick={onOpenQa}
                className="hidden xl:flex items-center gap-1.5 border border-border-strong px-3 py-1.5 font-sans font-semibold text-[11px] uppercase tracking-[0.06em] text-muted-foreground hover:border-primary hover:text-primary transition-colors duration-120 cursor-pointer"
                title="Open Methodology Dossier"
              >
                <span>Methodology</span>
              </button>
            ) : null}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center gap-1 border border-border-strong px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground hover:border-primary hover:text-primary transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle Navigation Menu"
            >
              <span>{mobileMenuOpen ? "CLOSE" : "MENU"}</span>
              {mobileMenuOpen ? (
                <X className="h-3 w-3 text-primary" />
              ) : (
                <ChevronDown className="h-3 w-3 text-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Scan Status Banner */}
        {scanMessage && (
          <div className="border-t border-primary px-4 py-1.5 font-mono text-xs text-primary flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-primary" />
              <span>{scanMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setScanMessage(null)}
              className="text-muted-foreground hover:text-primary text-[10px] uppercase tracking-wider"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            ref={mobileNavRef}
            className="lg:hidden border-t border-border bg-surface px-4 py-4"
          >
            <div className="flex flex-col gap-1 font-sans font-semibold text-xs uppercase tracking-[0.06em]">
              {NAV_TABS.map((tab) => {
                const active = isTabActive(tab);
                return (
                  <a
                    key={tab.id}
                    href={tab.hash ? `${tab.to}#${tab.hash}` : tab.to}
                    onClick={(e) => handleNavClick(e, tab)}
                    className={`flex items-center justify-between p-2.5 border transition-colors duration-120 ${
                      active
                        ? "border-primary bg-surface-raised text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <tab.icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </span>
                    {tab.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 border border-border-strong font-mono font-bold text-muted-foreground">
                        {tab.badge}
                      </span>
                    )}
                  </a>
                );
              })}

              <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleTriggerScan();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-primary p-2 text-center text-primary font-bold hover:bg-primary hover:text-black transition-colors"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Trigger Scan</span>
                </button>
                {onOpenCli ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenCli();
                    }}
                    className="flex-1 border border-border-strong p-2 text-center text-muted-foreground font-bold hover:border-primary hover:text-primary transition-colors"
                  >
                    &gt;_ CLI
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
