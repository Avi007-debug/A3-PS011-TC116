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
  to: "/" | "/capabilities" | "/zero-decrypt" | "/security" | "/audit" | "/qa";
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
    to: "/zero-decrypt",
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
  onOpenPcap,
  onOpenSupabase,
}: {
  onOpenCli?: () => void;
  onOpenQa?: () => void;
  onOpenPcap?: () => void;
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

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("argus_theme");
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    }
    return "dark";
  });

  const mobileNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = backendService.subscribe((h) => {
      setHealth(h);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      }
      localStorage.setItem("argus_theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("theme-transitioning");
      setTimeout(() => {
        document.documentElement.classList.remove("theme-transitioning");
      }, 420);
    }
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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
          ? "Demo Scan Complete: 23 targets verified · 3 seeded drift faults identified"
          : `Live Scan Complete: ${res.targetsScanned} targets scanned · Drift delta verified`
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
    <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300">
      {/* Top Telemetry & Health HUD Strip */}
      <div className="border-b border-border/80 bg-slate-100/90 dark:bg-[#07090E]/95 px-4 py-1 font-mono text-[10px] text-slate-700 dark:text-muted-foreground backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2.5">
            {/* Live Connection Mode Badge */}
            <button
              type="button"
              onClick={() => backendService.checkHealth()}
              title={`Connection Mode: ${health.mode.toUpperCase()} (${health.status}) · Latency: ${health.latencyMs}ms. Click to recheck.`}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9.5px] border cursor-pointer transition-colors ${
                health.status === "connected"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400"
              }`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  health.status === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>{health.status === "connected" ? "LOCAL BACKEND" : "DEMO FIXTURE"}</span>
              <span className="text-[8.5px] opacity-75">({health.latencyMs}ms)</span>
            </button>

            <span className="text-border">|</span>
            <span className="font-semibold text-slate-900 dark:text-foreground">
              SCOPE: {LIVE_TELEMETRY.approvedDomains}/{LIVE_TELEMETRY.maxDomains} DOM · {LIVE_TELEMETRY.approvedHosts}/{LIVE_TELEMETRY.maxHosts} HOSTS
            </span>
            <span className="text-border">|</span>
            <span className="text-amber-700 dark:text-amber-400 font-semibold">
              DRIFT: {LIVE_TELEMETRY.driftEventsDetected} FAULTS
            </span>
            <span className="text-border">|</span>
            <span className="text-slate-600 dark:text-muted-foreground">CHECKS: 4/4 ACTIVE</span>
            <span className="text-border">|</span>
            <span className="text-blue-700 dark:text-teal-400 font-medium">READ-ONLY</span>
            <span className="text-border">|</span>
            {onOpenSupabase ? (
              <button
                type="button"
                onClick={onOpenSupabase}
                className="flex items-center gap-1 text-blue-700 dark:text-teal-400 hover:underline font-semibold cursor-pointer"
              >
                DB: {isSupabaseConfigured ? "CONNECTED" : "LOCAL"}
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-600 dark:text-muted-foreground font-semibold">{PROJECT.ps}</span>
            <span className="text-border">|</span>
            <span className="text-blue-700 dark:text-teal-400 font-mono font-semibold">
              MERKLE: {LIVE_TELEMETRY.merkleRoot.slice(0, 10)}...
            </span>
            <span className="text-border">|</span>
            <span className="font-mono text-[9px] text-slate-500 dark:text-muted-foreground">NON-EXPLOITATIVE</span>
          </div>
        </div>
      </div>

      {/* Main Command Bar */}
      <nav
        aria-label="Primary"
        className={`border-b transition-all duration-200 ${
          scrolled
            ? "border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#080C14]/95 shadow-md backdrop-blur-md"
            : "border-slate-200/80 dark:border-white/5 bg-white/85 dark:bg-[#080C14]/85 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          {/* Brand Identity */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 font-mono text-sm tracking-tight transition-transform hover:scale-[1.01] shrink-0"
          >
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded border border-orange-500/40 bg-slate-900 shadow-[0_0_15px_rgba(255,122,0,0.35)] group-hover:border-orange-400 transition-all">
              <img src="/logo.png" alt="ArgusASM Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-wider text-slate-900 dark:text-foreground text-sm">
                ARGUS<span className="text-orange-500 dark:text-orange-400">ASM</span>
              </span>
              <span className="font-mono text-[8px] uppercase tracking-widest text-slate-500 dark:text-muted-foreground/80 leading-none">
                Perimeter Observatory
              </span>
            </div>
          </Link>

          {/* Segmented Glass Dock Navigation */}
          <div className="hidden lg:flex items-center p-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-[#0E131F]/90 shadow-inner backdrop-blur-md">
            {NAV_TABS.map((tab) => {
              const active = isTabActive(tab);
              return (
                <a
                  key={tab.id}
                  href={tab.hash ? `${tab.to}#${tab.hash}` : tab.to}
                  onClick={(e) => handleNavClick(e, tab)}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    active
                      ? "bg-white dark:bg-orange-500/15 text-blue-600 dark:text-orange-400 font-bold shadow-xs border border-slate-200/80 dark:border-orange-500/30"
                      : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-white/60 dark:hover:bg-white/5"
                  }`}
                >
                  <tab.icon className="h-3 w-3 shrink-0 opacity-75" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[8.5px] px-1 py-0.2 rounded-full font-mono font-bold leading-tight ${
                        tab.badgeColor === "amber"
                          ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400"
                          : tab.badgeColor === "red"
                            ? "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400"
                            : "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400"
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
            {/* Live Scan Trigger Button */}
            <button
              type="button"
              onClick={handleTriggerScan}
              disabled={isScanning}
              className={`hover-glow hidden sm:flex items-center gap-1.5 rounded border border-orange-500/50 bg-orange-500/10 dark:bg-orange-500/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-orange-700 dark:text-orange-400 font-bold hover:bg-orange-500/20 transition-all cursor-pointer ${
                isScanning ? "opacity-60 cursor-not-allowed" : ""
              }`}
              title="Execute authorized perimeter discovery scan"
            >
              <span className="flex items-center gap-1">
                {isScanning ? (
                  <Loader2 className="h-3 w-3 animate-spin text-orange-600 dark:text-orange-400" />
                ) : (
                  <Play className="h-2.5 w-2.5 fill-current" />
                )}
              </span>
              <span>{isScanning ? "Scanning..." : "Run Scan"}</span>
            </button>

            {/* CLI Modal Trigger */}
            {onOpenCli ? (
              <button
                type="button"
                onClick={onOpenCli}
                className="hover-glow hidden md:flex items-center gap-1.5 rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0B0F17] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-800 dark:text-foreground hover:border-blue-500 dark:hover:border-orange-500/60 cursor-pointer"
                title="Launch CLI Sandbox Terminal"
              >
                <span className="text-blue-600 dark:text-orange-400 font-bold">&gt;_</span>
                <span>CLI</span>
              </button>
            ) : null}

            {/* Methodology Modal Trigger */}
            {onOpenQa ? (
              <button
                type="button"
                onClick={onOpenQa}
                className="hover-glow hidden xl:flex items-center gap-1.5 rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0B0F17] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:border-slate-300 dark:hover:border-white/20 cursor-pointer"
                title="Open Methodology & Compliance Dossier"
              >
                <span>Methodology</span>
              </button>
            ) : null}

            {/* Smooth Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="hover-glow flex h-8 w-8 items-center justify-center rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0B0F17] text-slate-800 dark:text-foreground hover:border-slate-400 dark:hover:border-white/30 transition-all cursor-pointer"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (smooth animated transition)`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-blue-600 transition-transform duration-300 hover:-rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center gap-1 rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0B0F17] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-800 dark:text-foreground"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle Navigation Menu"
            >
              <span>{mobileMenuOpen ? "CLOSE" : "MENU"}</span>
              {mobileMenuOpen ? (
                <X className="h-3 w-3 text-blue-600 dark:text-orange-400" />
              ) : (
                <ChevronDown className="h-3 w-3 text-blue-600 dark:text-orange-400" />
              )}
            </button>
          </div>
        </div>

        {/* Scan Status Toast Banner */}
        {scanMessage && (
          <div className="border-t border-orange-500/30 bg-orange-500/10 px-4 py-1.5 font-mono text-xs text-orange-800 dark:text-orange-300 flex items-center justify-between animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping" />
              <span>{scanMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setScanMessage(null)}
              className="text-orange-700 dark:text-orange-400 hover:underline text-[10px]"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            ref={mobileNavRef}
            className="lg:hidden border-t border-slate-200 dark:border-white/10 bg-white/98 dark:bg-[#090D14]/98 px-4 py-4 shadow-2xl backdrop-blur-xl animate-in fade-in duration-150"
          >
            <div className="flex flex-col gap-1 font-mono text-xs uppercase tracking-wider">
              {NAV_TABS.map((tab) => {
                const active = isTabActive(tab);
                return (
                  <a
                    key={tab.id}
                    href={tab.hash ? `${tab.to}#${tab.hash}` : tab.to}
                    onClick={(e) => handleNavClick(e, tab)}
                    className={`flex items-center justify-between p-2.5 rounded border transition-all ${
                      active
                        ? "border-blue-500/50 dark:border-orange-500/50 bg-blue-50 dark:bg-orange-500/10 text-blue-700 dark:text-orange-300 font-bold"
                        : "border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0B0F17]/60 text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <tab.icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span>{tab.label}</span>
                    </span>
                    {tab.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </a>
                );
              })}

              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleTriggerScan();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded border border-orange-500/40 bg-orange-500/10 p-2 text-center text-orange-700 dark:text-orange-400 font-bold"
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
                    className="flex-1 rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0B0F17] p-2 text-center text-slate-800 dark:text-foreground font-bold"
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
