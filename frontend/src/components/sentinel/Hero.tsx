import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PROJECT, LIVE_TELEMETRY } from "@/data/sentinel";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  label?: string | undefined;
  isGateway?: boolean | undefined;
};

function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nodes: Node[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      nodes.length = 0;
      const count = Math.max(16, Math.min(36, Math.round((w * h) / 28000)));
      for (let i = 0; i < count; i++) {
        const isGw = i < 4;
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * (isGw ? 0.06 : 0.14),
          vy: (Math.random() - 0.5) * (isGw ? 0.06 : 0.14),
          r: isGw ? 4 : Math.random() > 0.8 ? 2.5 : 1.5,
          isGateway: isGw,
          label: isGw ? `EDGE-0${i + 1}` : undefined,
        });
      }
    };

    resize();
    seed();

    let t = 0;
    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        if (!reduced) {
          n.x += n.vx;
          n.y += n.vy;
        }
        if (n.x < 10 || n.x > w - 10) n.vx *= -1;
        if (n.y < 10 || n.y > h - 10) n.vy *= -1;
      }

      const isLight = document.documentElement.classList.contains("light");

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          if (!a || !b) continue;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 210) continue;
          const alpha = (1 - d / 210) * 0.38;

          const gwColor = isLight ? `rgba(16, 185, 129, ${alpha * 1.5})` : `rgba(45, 212, 191, ${alpha * 1.5})`;
          const normColor = isLight ? `rgba(148, 163, 184, ${alpha * 0.7})` : `rgba(100, 116, 139, ${alpha * 0.8})`;

          ctx.strokeStyle = a.isGateway || b.isGateway ? gwColor : normColor;
          ctx.lineWidth = a.isGateway && b.isGateway ? 1.5 : 1;
          ctx.setLineDash([4, 6]);
          ctx.lineDashOffset = reduced ? 0 : -t * 0.35;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.isGateway
          ? isLight ? "#10b981" : "#2dd4bf"
          : isLight ? "#94a3b8" : "#64748b";
        ctx.fill();

        if (n.isGateway && n.label) {
          ctx.font = "9px monospace";
          ctx.fillStyle = isLight ? "#0f766e" : "#5eead4";
          ctx.fillText(n.label, n.x + 8, n.y + 3);
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => {
      resize();
      seed();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full opacity-65" />;
}

export function Hero({
  panelOpen,
  setPanelOpen,
}: {
  panelOpen: boolean;
  setPanelOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const [activeTab, setActiveTab] = useState<"stream" | "probes" | "diff" | "merkle" | "hitl">("stream");
  const [hitlApprovals, setHitlApprovals] = useState<Record<string, "PENDING" | "APPROVED" | "REJECTED">>({
    "HITL-001": "PENDING",
    "HITL-002": "PENDING",
    "HITL-003": "PENDING",
  });
  const [probeChecksCount, setProbeChecksCount] = useState(148);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelPhase, setPanelPhase] = useState<"enter" | "exit">("enter");

  // Drive mount/unmount with animation phases
  useEffect(() => {
    if (panelOpen) {
      setPanelMounted(true);
      setPanelPhase("enter");
    } else {
      if (panelMounted) {
        setPanelPhase("exit");
        const t = setTimeout(() => setPanelMounted(false), 320); // match exit duration
        return () => clearTimeout(t);
      }
    }
  }, [panelOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProbeChecksCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2400);
    return () => clearInterval(interval);
  }, []);


  return (
    <section className="relative overflow-hidden orange-glow-screen px-5 pb-24 pt-28 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-35" aria-hidden="true" />
      <NetworkCanvas />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,transparent_20%,var(--background)_82%)]"
        aria-hidden="true"
      />

      <div
        className="relative mx-auto grid w-full max-w-6xl gap-10 lg:items-start"
        style={{
          gridTemplateColumns: panelOpen ? "1.4fr 0.6fr" : "3fr 1fr",
          transition: "grid-template-columns 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Left Column: Mission, Value Prop, CTAs */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em]">
              <span className="border border-primary/50 bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                {PROJECT.ps}
              </span>
              <span className="border border-border bg-surface px-2.5 py-1 text-muted-foreground">
                {PROJECT.org}
              </span>
              <span className="border border-border bg-surface px-2.5 py-1 text-muted-foreground">
                {PROJECT.theme}
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              Continuous Visibility.
              <br />
              <span className="text-primary underline decoration-primary/40 decoration-1 underline-offset-8">
                Zero Exploitation. Provable Drift.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              <strong className="text-foreground font-semibold">ArgusASM</strong> is an autonomous attack-surface
              discovery and drift sentinel for lab domains and hosts. It continuously catalogs DNS records,
              inspects TLS certificates, audits permitted service ports, identifies potential dangling CNAMEs, and
              computes stateful baseline drift anchored to a cryptographic SHA-256 Merkle ledger.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/capabilities"
                className="hover-glow inline-flex items-center gap-2 border border-primary/70 bg-primary/15 px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-primary font-bold shadow-[0_0_15px_rgba(20,184,166,0.2)] cursor-pointer"
              >
                Inspect Asset Inventory
              </Link>
              <Link
                to="/drift"
                className="hover-glow inline-flex items-center gap-2 border border-border bg-surface px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-foreground/90 hover:text-foreground font-semibold"
              >
                Drift Timeline (T0 vs T1)
              </Link>
              <Link
                to="/security"
                className="hover-glow inline-flex items-center gap-2 border border-border bg-surface/60 px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
              >
                Perimeter Hygiene (68/100)
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Animated HUD Panel or Round Button */}
        {panelMounted ? (
          <div className={panelPhase === "enter" ? "hud-panel-enter" : "hud-panel-exit"}>
            <div className="flex min-h-[560px] flex-col overflow-hidden border border-border bg-surface">

          {/* Console Header / Tabs */}
          <div className="flex items-center justify-between border-b border-border bg-surface-raised px-3.5 py-2 text-[11px] font-mono">
            <div className="flex flex-wrap items-center gap-0">
              <button
                type="button"
                onClick={() => setActiveTab("stream")}
                className={`px-3 py-1.5 font-sans font-semibold uppercase tracking-[0.06em] text-[10px] transition-colors cursor-pointer border-b-2 ${
                  activeTab === "stream"
                    ? "border-b-primary text-primary bg-surface"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 bg-current align-middle mr-1.5" />Live Perimeter
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("probes")}
                className={`px-3 py-1.5 font-sans font-semibold uppercase tracking-[0.06em] text-[10px] transition-colors cursor-pointer border-b-2 ${
                  activeTab === "probes"
                    ? "border-b-primary text-primary bg-surface"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                4 Documented Probes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("diff")}
                className={`px-3 py-1.5 font-sans font-semibold uppercase tracking-[0.06em] text-[10px] transition-colors cursor-pointer border-b-2 ${
                  activeTab === "diff"
                    ? "border-b-primary text-primary bg-surface"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                T0 vs T1 Diff
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("merkle")}
                className={`px-3 py-1.5 font-sans font-semibold uppercase tracking-[0.06em] text-[10px] transition-colors cursor-pointer border-b-2 ${
                  activeTab === "merkle"
                    ? "border-b-primary text-primary bg-surface"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Merkle Receipt
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("hitl")}
                className={`px-3 py-1.5 font-sans font-semibold uppercase tracking-[0.06em] text-[10px] transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === "hitl"
                    ? "border-b-amber-500 text-amber-600 dark:text-amber-400 bg-surface"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                <span>HITL Gate</span>
                <span className="border border-amber-500/40 bg-amber-500/10 px-1 py-0.2 text-[9px] text-amber-500 font-bold">
                  {Object.values(hitlApprovals).filter((v) => v === "PENDING").length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span className="flex items-center gap-1.5 text-success">
                <span className="h-1.5 w-1.5 bg-success" />
                <span className="font-bold">GUARDRAILS ACTIVE</span>
              </span>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="flex items-center gap-1 border border-border-strong px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors cursor-pointer"
                title="Hide Live Perimeter Console"
                aria-label="Close panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><polyline points="9 18 15 12 9 6" /></svg>
                <span className="text-[9px] uppercase tracking-wider">Hide</span>
              </button>
            </div>
          </div>

          {/* Sub-HUD Metrics Ribbon */}
          <div className="grid grid-cols-4 border-b border-border bg-surface-raised px-4 py-2 font-mono text-[10.5px] text-muted-foreground">
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">POLICY</span>
              <span className="text-foreground font-semibold">READ-ONLY PROBES</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">CHECKS RUN</span>
              <span className="text-primary font-bold tabular-nums">{probeChecksCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">SCOPE LOCK</span>
              <span className="text-foreground font-semibold">20 DOM / 10 HOST</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">EXPLOITATION</span>
              <span className="text-success font-bold">ZERO (PASSIVE)</span>
            </div>
          </div>

          {/* Console Tab Contents */}
          <div className="flex-1 p-4 font-mono text-[11.5px] leading-relaxed overflow-y-auto bg-surface-raised/40 dark:bg-[#000000] border-t border-border">
            {activeTab === "stream" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  <span className="text-primary font-semibold">[APPROVED PERIMETER DISCOVERY STREAM]</span>
                  <span>PS-011 AUTHORIZED SCOPE</span>
                </div>

                <div className="space-y-1.5 font-mono text-[11.5px] text-foreground">
                  <div className="flex items-start gap-2 p-1.5 border-l-2 border-info hover:bg-surface-raised transition-colors">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:11</span>
                    <span className="text-info font-bold shrink-0">[SCOPE_LOCK]</span>
                    <span className="truncate">Validated approved_scope.json: 15 domains, 8 hosts within caps</span>
                  </div>

                  <div className="flex items-start gap-2 p-1.5 border-l-2 border-info hover:bg-surface-raised transition-colors">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:12</span>
                    <span className="text-info font-bold shrink-0">[DNS_PROBE]</span>
                    <span className="truncate">aiori.lab &rarr; A:10.0.1.10, NS:ns-01.aiori.lab, MX:10 mail.aiori.lab (TTL 300)</span>
                  </div>

                  <div className="flex items-start gap-2 p-1.5 border-l-2 border-destructive hover:bg-surface-raised transition-colors">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:13</span>
                    <span className="text-destructive font-bold shrink-0">[TLS_ALERT]</span>
                    <span className="text-destructive">legacy.aiori.lab:443 certificate expired on 2026-01-01 (RFC 5280)</span>
                  </div>

                  <div className="flex items-start gap-2 p-1.5 border-l-2 border-warn hover:bg-surface-raised transition-colors">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:14</span>
                    <span className="text-warn font-bold shrink-0">[PORT_WARN]</span>
                    <span className="text-warn">dev-edge.aiori.lab:8080 OPEN (Werkzeug debug console exposed)</span>
                  </div>

                  <div className="flex items-start gap-2 p-1.5 border-l-2 border-destructive hover:bg-surface-raised transition-colors">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:15</span>
                    <span className="text-destructive font-bold shrink-0">[DANGLING_DNS]</span>
                    <span className="text-destructive">test-s3.aiori.lab &rarr; Orphaned CNAME to unallocated S3 (NoSuchBucket)</span>
                  </div>

                  <div className="flex items-start gap-2 p-1.5 border-l-2 border-success hover:bg-surface-raised transition-colors">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:16</span>
                    <span className="text-success font-bold shrink-0">[MERKLE_ROOT]</span>
                    <span className="text-success truncate">Chained T1 snapshot hash to Block #1840291 (Receipt verified)</span>
                  </div>
                </div>

                <div className="mt-4 border border-border bg-surface p-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-warn">PERIMETER HYGIENE SCORE: 68/100 (ELEVATED RISK)</span>
                    <span className="text-info font-mono text-[10px] animate-pulse flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 bg-info" /> Continuous Scan</span>
                  </div>
                  <p className="mt-1 text-[10.5px] text-muted-foreground font-sans">
                    3 seeded issues detected in current snapshot: 1 expired TLS certificate (-35), 1 unexpected open port (-25), and 1 potential dangling CNAME (-30).
                  </p>
                </div>
              </div>
            )}

            {activeTab === "probes" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10.5px] uppercase tracking-wider text-primary border-b border-border pb-1">
                  <span>The 4 Documented Probes (PS-011 Specification)</span>
                  <span className="text-muted-foreground">Standardized Checks</span>
                </div>
                <div className="border border-border bg-surface p-3 space-y-2 text-foreground font-mono text-[11px]">
                  <div>├─ [Check 1: DNS Inventory] Resolves A, AAAA, CNAME, MX, TXT, NS per RFC 1035</div>
                  <div className="pl-5 text-muted-foreground">└─ Tracks TTLs, authoritative nameservers, and zone modification timestamps</div>
                  <div>├─ [Check 2: TLS Certificate] Inspects Subject, Issuer, Expiry date, SANs per RFC 5280</div>
                  <div className="pl-5 text-destructive font-semibold">└─ Flagged: legacy.aiori.lab expired cert (Trust chain failure)</div>
                  <div>├─ [Check 3: Permitted Ports] Strictly limited to ports [22, 53, 80, 443, 8080]</div>
                  <div className="pl-5 text-warn font-semibold">└─ Flagged: dev-edge.aiori.lab:8080 open outside approved whitelist</div>
                  <div>└─ [Check 4: Dangling DNS] Detects orphaned cloud CNAMEs (AWS S3, GitHub, Azure)</div>
                  <div className="pl-5 text-destructive font-semibold">└─ Flagged: test-s3.aiori.lab points to deprovisioned S3 (NoSuchBucket)</div>
                </div>
              </div>
            )}

            {activeTab === "diff" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10.5px] uppercase tracking-wider text-primary border-b border-border pb-1">
                  <span>Stateful Drift Delta (T0 Baseline vs T1 Current)</span>
                  <span className="text-primary font-semibold">3 Delta Events</span>
                </div>
                <div className="space-y-2 text-[11px] font-mono">
                  <div className="border border-destructive p-2 border-l-4">
                    <span className="font-bold text-destructive">[CRITICAL DRIFT] EXPIRED_CERT: legacy.aiori.lab</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">T0: Active / Valid | T1: Expired (-292 days overdue)</p>
                  </div>
                  <div className="border border-warn p-2 border-l-4">
                    <span className="font-bold text-warn">[HIGH DRIFT] NEW_SERVICE: dev-edge.aiori.lab:8080</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">T0: Port 8080 Filtered | T1: Port 8080 OPEN (Werkzeug debug console)</p>
                  </div>
                  <div className="border border-destructive p-2 border-l-4">
                    <span className="font-bold text-destructive">[HIGH DRIFT] DANGLING_DNS: test-s3.aiori.lab</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">T0: Active cloud target | T1: Deprovisioned bucket (HTTP 404 NoSuchBucket)</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "merkle" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10.5px] uppercase tracking-wider text-primary border-b border-border pb-1">
                  <span>Cryptographic Merkle Baseline Attestation</span>
                  <span className="text-muted-foreground">SHA-256 Provenance</span>
                </div>
                <pre className="border border-border bg-surface p-3 font-mono text-[10.5px] leading-snug text-foreground overflow-x-auto">
{`Merkle Root: ${LIVE_TELEMETRY.merkleRoot}
Block Height: #${LIVE_TELEMETRY.blockHeight} · Status: VERIFIED_TAMPER_FREE
├─ Leaf 1 (Approved Scope):   0x7f82b9a4c1e3...
├─ Leaf 2 (DNS Inventory):    0x1a2b3c4d5e6f...
├─ Leaf 3 (TLS Certificates): 0x9e8d7c6b5a4f...
├─ Leaf 4 (Port Profiles):    0x3f5c7e9b0d2a...
└─ Leaf 5 (Dangling DNS):     0x8a9b0c1d2e3f...

Evaluation Timestamp: 2026-10-20T04:30:00Z
AIORI Hackathon 2026 · Problem Statement PS-011`}
                </pre>
              </div>
            )}

            {activeTab === "hitl" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10.5px] uppercase tracking-wider text-amber-500 border-b border-border pb-1">
                  <span>Human-in-the-Loop (HITL) Governance Queue</span>
                  <span className="text-muted-foreground">Zero Autonomous Disruption</span>
                </div>

                <p className="text-[10.5px] text-muted-foreground leading-snug">
                  High-criticality perimeter findings and remediation actions require explicit operator sign-off before production dispatch.
                </p>

                <div className="space-y-2 font-mono text-[11px]">
                  {/* Item 1: TLS Renewal */}
                  <div className="border border-border bg-surface p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-destructive/15 text-destructive text-[9.5px] font-bold px-1.5 py-0.5 border border-destructive/30">
                          CRITICAL
                        </span>
                        <span className="font-bold text-foreground">legacy.aiori.lab:443</span>
                      </div>
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.5 border ${
                          hitlApprovals["HITL-001"] === "APPROVED"
                            ? "bg-success/15 text-success border-success/40"
                            : "bg-amber-500/15 text-amber-500 border-amber-500/40"
                        }`}
                      >
                        {hitlApprovals["HITL-001"] === "APPROVED" ? "AUTHORIZED BY HUMAN" : "PENDING OPERATOR SIGN-OFF"}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[10px]">
                      Action: ACME certificate renewal & Nginx reload (Remediates -35 score drop)
                    </p>
                    <div className="flex gap-2 pt-1 border-t border-border/50">
                      <button
                        type="button"
                        onClick={() => setHitlApprovals((prev) => ({ ...prev, "HITL-001": "APPROVED" }))}
                        className="bg-primary/15 text-primary border border-primary/40 px-2 py-0.5 text-[9.5px] font-bold hover:bg-primary/25 cursor-pointer"
                      >
                        Sign-off (Authorize)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHitlApprovals((prev) => ({ ...prev, "HITL-001": "REJECTED" }))}
                        className="bg-surface text-muted-foreground border border-border px-2 py-0.5 text-[9.5px] hover:text-foreground cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* Item 2: Port 8080 */}
                  <div className="border border-border bg-surface p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-amber-500/15 text-amber-500 text-[9.5px] font-bold px-1.5 py-0.5 border border-amber-500/30">
                          HIGH
                        </span>
                        <span className="font-bold text-foreground">dev-edge.aiori.lab:8080</span>
                      </div>
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.5 border ${
                          hitlApprovals["HITL-002"] === "APPROVED"
                            ? "bg-success/15 text-success border-success/40"
                            : "bg-amber-500/15 text-amber-500 border-amber-500/40"
                        }`}
                      >
                        {hitlApprovals["HITL-002"] === "APPROVED" ? "AUTHORIZED BY HUMAN" : "PENDING OPERATOR SIGN-OFF"}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[10px]">
                      Action: Host firewall drop rule `ufw deny 8080/tcp` (Remediates -25 score drop)
                    </p>
                    <div className="flex gap-2 pt-1 border-t border-border/50">
                      <button
                        type="button"
                        onClick={() => setHitlApprovals((prev) => ({ ...prev, "HITL-002": "APPROVED" }))}
                        className="bg-primary/15 text-primary border border-primary/40 px-2 py-0.5 text-[9.5px] font-bold hover:bg-primary/25 cursor-pointer"
                      >
                        Sign-off (Authorize)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHitlApprovals((prev) => ({ ...prev, "HITL-002": "REJECTED" }))}
                        className="bg-surface text-muted-foreground border border-border px-2 py-0.5 text-[9.5px] hover:text-foreground cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* Item 3: Dangling S3 */}
                  <div className="border border-border bg-surface p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-amber-500/15 text-amber-500 text-[9.5px] font-bold px-1.5 py-0.5 border border-amber-500/30">
                          HIGH
                        </span>
                        <span className="font-bold text-foreground">test-s3.aiori.lab</span>
                      </div>
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.5 border ${
                          hitlApprovals["HITL-003"] === "APPROVED"
                            ? "bg-success/15 text-success border-success/40"
                            : "bg-amber-500/15 text-amber-500 border-amber-500/40"
                        }`}
                      >
                        {hitlApprovals["HITL-003"] === "APPROVED" ? "AUTHORIZED BY HUMAN" : "PENDING OPERATOR SIGN-OFF"}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[10px]">
                      Action: Delete orphaned CNAME record in authoritative zone (Remediates -30 score drop)
                    </p>
                    <div className="flex gap-2 pt-1 border-t border-border/50">
                      <button
                        type="button"
                        onClick={() => setHitlApprovals((prev) => ({ ...prev, "HITL-003": "APPROVED" }))}
                        className="bg-primary/15 text-primary border border-primary/40 px-2 py-0.5 text-[9.5px] font-bold hover:bg-primary/25 cursor-pointer"
                      >
                        Sign-off (Authorize)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHitlApprovals((prev) => ({ ...prev, "HITL-003": "REJECTED" }))}
                        className="bg-surface text-muted-foreground border border-border px-2 py-0.5 text-[9.5px] hover:text-foreground cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
          </div>
        ) : (
          /* Round button shown when panel is not mounted */
          <div className="hidden lg:flex items-center justify-center min-h-[400px]">
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                background: "var(--surface-raised)",
                border: "2px solid var(--primary)",
                color: "var(--primary)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 0 24px rgba(252,238,10,0.15), 0 0 0 4px rgba(252,238,10,0.05)",
              }}
              title="Open Live Perimeter Console"
              aria-label="Open Live Perimeter Panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "7px",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}>LIVE HUD</span>
            </button>
          </div>
        )}
      </div>

      {/* Key Metric Indicators - full width, always same size */}
      <div className="relative mx-auto mt-10 grid w-full max-w-6xl grid-cols-2 gap-3 border-t border-border/80 pt-6 sm:grid-cols-4 font-mono">
        <div className="bg-surface border border-border p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Approved Scope</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {LIVE_TELEMETRY.approvedDomains} / {LIVE_TELEMETRY.maxDomains} Domains
          </p>
        </div>
        <div className="bg-surface border border-border p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Monitored Hosts</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-primary">
            {LIVE_TELEMETRY.approvedHosts} / {LIVE_TELEMETRY.maxHosts} Hosts
          </p>
        </div>
        <div className="bg-surface border border-border p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Probes</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">4/4 Documented</p>
        </div>
        <div className="bg-surface border border-border p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Drift Detected</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-warn">{LIVE_TELEMETRY.driftEventsDetected} Faults</p>
        </div>
      </div>

    </section>

  );
}



