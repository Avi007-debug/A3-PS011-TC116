import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { PROJECT, LIVE_TELEMETRY } from "@/data/sentinel";
import { isSupabaseConfigured } from "@/lib/supabase";

interface NavModule {
  id: string;
  to: "/" | "/security" | "/zero-decrypt" | "/capabilities" | "/audit" | "/qa";
  hash?: string;
  num: string;
  label: string;
  category: "Core ASM Intelligence" | "Posture & Drift" | "Methodology & Ledger";
  desc: string;
  badge?: string;
}

const NAV_MODULES: NavModule[] = [
  {
    id: "overview",
    to: "/",
    num: "01",
    label: "Overview & Mission",
    category: "Core ASM Intelligence",
    desc: "Attack-surface discovery & continuous monitoring paradigm",
  },
  {
    id: "inventory",
    to: "/capabilities",
    hash: "features",
    num: "02",
    label: "Asset Inventory",
    category: "Core ASM Intelligence",
    desc: "Catalog of approved domains, hosts, and DNS records",
    badge: "15 Assets",
  },
  {
    id: "probes",
    to: "/capabilities",
    hash: "pipeline",
    num: "03",
    label: "4 Documented Probes",
    category: "Core ASM Intelligence",
    desc: "DNS, TLS, Permitted Ports & Dangling DNS engine",
    badge: "RFC Compliant",
  },
  {
    id: "drift",
    to: "/zero-decrypt",
    num: "04",
    label: "Drift Timeline",
    category: "Posture & Drift",
    desc: "Stateful T0 vs T1 baseline diff & historical scrubber",
    badge: "Delta Active",
  },
  {
    id: "score",
    to: "/security",
    hash: "score",
    num: "05",
    label: "Perimeter Hygiene Score",
    category: "Posture & Drift",
    desc: "0–100 posture score with CVSS-weighted deductions",
    badge: "68 / 100",
  },
  {
    id: "findings",
    to: "/security",
    hash: "sandbox",
    num: "06",
    label: "Findings & Seeded Issues",
    category: "Posture & Drift",
    desc: "Expired certs, shadow port 8080, and dangling S3 CNAMEs",
  },
  {
    id: "certs",
    to: "/security",
    hash: "pqc",
    num: "07",
    label: "Certificate & Cipher Matrix",
    category: "Posture & Drift",
    desc: "X.509 validity, SANs, TLS 1.3/1.2 & cryptographic posture",
  },
  {
    id: "ledger",
    to: "/audit",
    hash: "ledger",
    num: "08",
    label: "Merkle Baseline Ledger",
    category: "Methodology & Ledger",
    desc: "Cryptographic SHA-256 Merkle root & snapshot receipts",
    badge: "Tamper-Proof",
  },
  {
    id: "methodology",
    to: "/qa",
    num: "09",
    label: "Methodology & Dossier",
    category: "Methodology & Ledger",
    desc: "Non-exploitation guardrails, RFC 1035/5280 compliance",
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
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("argus_theme");
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    }
    return "dark";
  });

  const desktopDropdownRef = useRef<HTMLDivElement | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);

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
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleNavClick = (e: React.MouseEvent, mod: NavModule) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(false);
    navigate({ to: mod.to }).then(() => {
      if (mod.hash) {
        setTimeout(() => {
          const el = document.getElementById(mod.hash!);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const categories = Array.from(new Set(NAV_MODULES.map((m) => m.category)));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideDesktop = desktopDropdownRef.current?.contains(target);
      const isInsideMobile = mobileDropdownRef.current?.contains(target);
      if (!isInsideDesktop && !isInsideMobile) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300">
      {/* Top HUD Telemetry strip */}
      <div className="border-b border-border/60 bg-background/95 px-4 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-primary">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              STATUS: ONLINE
            </span>
            <span className="text-border">|</span>
            <span className="text-foreground font-semibold">SCOPE: 20 DOMAINS / 10 HOSTS</span>
            <span className="text-border">|</span>
            <span className="text-amber-400 font-semibold">DRIFT: DETECTED (3 EVENTS)</span>
            <span className="text-border">|</span>
            <span className="text-muted-foreground">CHECKS: 4/4 ACTIVE</span>
            <span className="text-border">|</span>
            {onOpenSupabase ? (
              <button
                type="button"
                onClick={onOpenSupabase}
                className="flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer"
              >
                DB: {isSupabaseConfigured ? "CONNECTED" : "LOCAL"}
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{PROJECT.ps}</span>
            <span className="text-border">|</span>
            <span className="text-primary font-semibold">MERKLE: {LIVE_TELEMETRY.merkleRoot.slice(0, 10)}...</span>
            <span className="text-border">|</span>
            <span className="font-mono text-[9px] text-muted-foreground">{PROJECT.compliance}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation bar */}
      <nav
        aria-label="Primary"
        className={`border-b border-border/80 transition-all duration-200 ${
          scrolled ? "bg-background/95 shadow-2xl backdrop-blur-md" : "bg-background/80 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-8 lg:px-12 relative">
          {/* Logo & ID Tag */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 font-mono text-sm tracking-tight transition-transform hover:scale-[1.02] z-10"
          >
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded border border-primary/50 bg-surface/90 shadow-[0_0_12px_rgba(20,184,166,0.3)] group-hover:border-primary transition-all">
              <img src="/logo.png" alt="ArgusASM Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-wider text-foreground">
                ARGUS<span className="text-primary">ASM</span>
              </span>
              <span className="font-mono text-[8.5px] uppercase tracking-widest text-muted-foreground">
                Attack-Surface & Drift Sentinel
              </span>
            </div>
          </Link>

          {/* Absolute Centered Explore Modules Dropdown */}
          <div className="hidden lg:flex absolute inset-x-0 top-0 bottom-0 items-center justify-center pointer-events-none">
            <div className="relative pointer-events-auto" ref={desktopDropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`hover-glow flex items-center gap-2 border px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
                  dropdownOpen
                    ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(20,184,166,0.25)]"
                    : "border-border/90 bg-surface/90 text-foreground hover:border-primary/60"
                }`}
                aria-expanded={dropdownOpen}
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="font-bold">Explore Modules</span>
                </div>
                <span className={`text-[10px] text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180 text-primary" : ""}`}>
                  ▼
                </span>
              </button>

              {/* Centered Dropdown Menu Overlay */}
              {dropdownOpen && (
                <div className="absolute left-1/2 top-full mt-2 w-[92vw] max-w-3xl -translate-x-1/2 border border-border/90 bg-surface/95 p-4 shadow-2xl backdrop-blur-xl z-50 pointer-events-auto">
                  <div className="flex items-center justify-between border-b border-border/70 pb-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-2 text-primary font-bold">
                      <span className="h-2 w-2 bg-primary" />
                      ArgusASM Capability Matrix
                    </span>
                    <span className="text-[10px]">9 Dedicated Views · PS-011</span>
                  </div>

                  <div className="mt-3 grid gap-4 md:grid-cols-3">
                    {categories.map((cat) => (
                      <div key={cat} className="space-y-2">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary/80 border-b border-border/40 pb-1">
                          {cat}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {NAV_MODULES.filter((m) => m.category === cat).map((mod) => (
                            <a
                              key={mod.id}
                              href={mod.hash ? `${mod.to}#${mod.hash}` : mod.to}
                              onClick={(e) => handleNavClick(e, mod)}
                              className="group flex flex-col gap-1 border border-border/40 bg-background/50 p-2 transition-all hover:border-primary/50 hover:bg-surface-raised cursor-pointer"
                            >
                              <div className="flex items-center justify-between font-mono text-[10.5px]">
                                <span className="font-bold text-foreground group-hover:text-primary">
                                  <span className="text-muted-foreground mr-1">[{mod.num}]</span>
                                  {mod.label}
                                </span>
                                {mod.badge && (
                                  <span className="text-[9px] border border-primary/30 bg-primary/10 px-1 py-0.5 text-primary">
                                    {mod.badge}
                                  </span>
                                )}
                              </div>
                              <p className="font-sans text-[10px] text-muted-foreground leading-tight">
                                {mod.desc}
                              </p>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-border/70 pt-2.5 font-mono text-[10px] text-muted-foreground">
                    <span className="text-foreground/90 font-semibold">AIORI Hackathon 2026 · Problem Statement PS-011</span>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(false)}
                      className="text-primary hover:underline"
                    >
                      Close [ESC]
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs & Mobile Dropdown Fallback */}
          <div className="flex items-center gap-2 z-10">
            <div className="lg:hidden relative" ref={mobileDropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="hover-glow flex items-center gap-1.5 border border-border/90 bg-surface/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground hover:border-primary/60"
              >
                <span>Modules</span>
                <span className="text-[8px]">▼</span>
              </button>
            </div>

            {onOpenCli ? (
              <button
                type="button"
                onClick={onOpenCli}
                className="hover-glow hidden sm:flex items-center gap-1.5 border border-border bg-surface px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-foreground hover:border-primary cursor-pointer"
                title="Launch CLI Sandbox Terminal"
              >
                <span className="text-primary font-bold">&gt;_</span>
                <span>CLI Terminal</span>
              </button>
            ) : null}

            {onOpenQa ? (
              <button
                type="button"
                onClick={onOpenQa}
                className="hover-glow hidden md:flex items-center gap-1.5 border border-border bg-surface px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-foreground hover:border-primary cursor-pointer"
                title="Open Methodology & Compliance Dossier"
              >
                <span>Methodology</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={toggleTheme}
              className="hover-glow flex h-8 w-8 items-center justify-center border border-border bg-surface text-foreground hover:border-primary transition-colors cursor-pointer"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
