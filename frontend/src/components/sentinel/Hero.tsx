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

export function Hero() {
  const [activeTab, setActiveTab] = useState<"stream" | "probes" | "diff" | "merkle">("stream");
  const [probeChecksCount, setProbeChecksCount] = useState(148);

  useEffect(() => {
    const interval = setInterval(() => {
      setProbeChecksCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-35" aria-hidden="true" />
      <NetworkCanvas />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,transparent_20%,var(--background)_82%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
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
                to="/zero-decrypt"
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

          {/* Key Metric Indicators */}
          <div className="mt-10 grid grid-cols-2 gap-3 border-t border-border/80 pt-6 sm:grid-cols-4 font-mono">
            <div className="bg-surface/50 border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Approved Scope</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {LIVE_TELEMETRY.approvedDomains} / {LIVE_TELEMETRY.maxDomains} Domains
              </p>
            </div>
            <div className="bg-surface/50 border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Monitored Hosts</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-primary">
                {LIVE_TELEMETRY.approvedHosts} / {LIVE_TELEMETRY.maxHosts} Hosts
              </p>
            </div>
            <div className="bg-surface/50 border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Probes</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">4/4 Documented</p>
            </div>
            <div className="bg-surface/50 border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Drift Detected</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-amber-400">{LIVE_TELEMETRY.driftEventsDetected} Faults</p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Telemetry Console */}
        <div className="panel scanlines flex min-h-[560px] flex-col overflow-hidden border-border/90 bg-surface/95 shadow-2xl">
          {/* Console Header / Tabs */}
          <div className="flex items-center justify-between border-b border-border bg-background/90 px-3.5 py-2.5 text-[11px] font-mono">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("stream")}
                className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                  activeTab === "stream"
                    ? "border-b-2 border-primary bg-primary/15 text-primary font-bold shadow-[0_0_10px_rgba(20,184,166,0.15)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ● Live Perimeter
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("probes")}
                className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                  activeTab === "probes"
                    ? "border-b-2 border-primary bg-primary/15 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                4 Documented Probes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("diff")}
                className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                  activeTab === "diff"
                    ? "border-b-2 border-primary bg-primary/15 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                T0 vs T1 Diff
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("merkle")}
                className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                  activeTab === "merkle"
                    ? "border-b-2 border-primary bg-primary/15 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Merkle Receipt
              </button>
            </div>

            <div className="flex items-center gap-2 text-primary font-mono text-[10.5px]">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-bold">GUARDRAILS ACTIVE</span>
            </div>
          </div>

          {/* Sub-HUD Metrics Ribbon */}
          <div className="grid grid-cols-4 border-b border-border/70 bg-background/60 px-4 py-2 font-mono text-[10.5px] text-muted-foreground">
            <div>
              <span className="block text-[9px] uppercase tracking-wider">POLICY</span>
              <span className="text-foreground font-semibold">READ-ONLY PROBES</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider">CHECKS RUN</span>
              <span className="text-primary font-bold tabular-nums">{probeChecksCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider">SCOPE LOCK</span>
              <span className="text-foreground font-semibold">20 DOM / 10 HOST</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider">EXPLOITATION</span>
              <span className="text-primary font-bold">ZERO (PASSIVE)</span>
            </div>
          </div>

          {/* Console Tab Contents */}
          <div className="flex-1 p-4 font-mono text-[11.5px] leading-relaxed overflow-y-auto">
            {activeTab === "stream" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  <span className="text-primary font-semibold">[APPROVED PERIMETER DISCOVERY STREAM]</span>
                  <span>PS-011 AUTHORIZED SCOPE</span>
                </div>

                <div className="space-y-1.5 font-mono text-[11.5px] text-foreground/90">
                  <div className="flex items-start gap-2 bg-background/60 p-1.5 border-l-2 border-primary/50">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:11</span>
                    <span className="text-primary font-bold shrink-0">[SCOPE_LOCK]</span>
                    <span className="truncate">Validated approved_scope.json: 15 domains, 8 hosts within caps</span>
                  </div>

                  <div className="flex items-start gap-2 bg-primary/10 p-1.5 border-l-2 border-primary">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:12</span>
                    <span className="text-primary font-bold shrink-0">[DNS_PROBE]</span>
                    <span className="truncate">aiori.lab &rarr; A:10.0.1.10, NS:ns-01.aiori.lab, MX:10 mail.aiori.lab (TTL 300)</span>
                  </div>

                  <div className="flex items-start gap-2 bg-destructive/10 p-1.5 border-l-2 border-destructive">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:13</span>
                    <span className="text-destructive font-bold shrink-0">[TLS_ALERT]</span>
                    <span className="text-destructive">legacy.aiori.lab:443 certificate expired on 2026-01-01 (RFC 5280)</span>
                  </div>

                  <div className="flex items-start gap-2 bg-amber-500/10 p-1.5 border-l-2 border-amber-500">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:14</span>
                    <span className="text-amber-500 font-bold shrink-0">[PORT_WARN]</span>
                    <span className="text-amber-700 dark:text-amber-200">dev-edge.aiori.lab:8080 OPEN (Werkzeug debug console exposed)</span>
                  </div>

                  <div className="flex items-start gap-2 bg-destructive/10 p-1.5 border-l-2 border-destructive">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:15</span>
                    <span className="text-destructive font-bold shrink-0">[DANGLING_DNS]</span>
                    <span className="text-destructive">test-s3.aiori.lab &rarr; Orphaned CNAME to unallocated S3 (NoSuchBucket)</span>
                  </div>

                  <div className="flex items-start gap-2 bg-primary/10 p-1.5 border-l-2 border-primary">
                    <span className="text-muted-foreground shrink-0 text-[10.5px]">14:02:16</span>
                    <span className="text-primary font-bold shrink-0">[MERKLE_ROOT]</span>
                    <span className="text-primary truncate">Chained T1 snapshot hash to Block #1840291 (Receipt verified)</span>
                  </div>
                </div>

                <div className="mt-4 rounded border border-border/80 bg-background/80 p-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-400">PERIMETER HYGIENE SCORE: 68/100 (ELEVATED RISK)</span>
                    <span className="text-primary font-mono text-[10px] animate-pulse">● Continuous Scan</span>
                  </div>
                  <p className="mt-1 text-[10.5px] text-muted-foreground font-sans">
                    3 seeded issues detected in current snapshot: 1 expired TLS certificate (-35), 1 unexpected open port (-25), and 1 potential dangling CNAME (-30).
                  </p>
                </div>
              </div>
            )}

            {activeTab === "probes" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10.5px] uppercase tracking-wider text-primary border-b border-border/40 pb-1">
                  <span>The 4 Documented Probes (PS-011 Specification)</span>
                  <span className="text-muted-foreground">Standardized Checks</span>
                </div>
                <div className="border border-border/80 bg-background/60 p-3 space-y-2 text-foreground/90 font-mono text-[11px]">
                  <div>├─ [Check 1: DNS Inventory] Resolves A, AAAA, CNAME, MX, TXT, NS per RFC 1035</div>
                  <div className="pl-5 text-muted-foreground">└─ Tracks TTLs, authoritative nameservers, and zone modification timestamps</div>
                  <div>├─ [Check 2: TLS Certificate] Inspects Subject, Issuer, Expiry date, SANs per RFC 5280</div>
                  <div className="pl-5 text-destructive font-semibold">└─ Flagged: legacy.aiori.lab expired cert (Trust chain failure)</div>
                  <div>├─ [Check 3: Permitted Ports] Strictly limited to ports [22, 53, 80, 443, 8080]</div>
                  <div className="pl-5 text-amber-500 font-semibold">└─ Flagged: dev-edge.aiori.lab:8080 open outside approved whitelist</div>
                  <div>└─ [Check 4: Dangling DNS] Detects orphaned cloud CNAMEs (AWS S3, GitHub, Azure)</div>
                  <div className="pl-5 text-destructive font-semibold">└─ Flagged: test-s3.aiori.lab points to deprovisioned S3 (NoSuchBucket)</div>
                </div>
              </div>
            )}

            {activeTab === "diff" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10.5px] uppercase tracking-wider text-primary border-b border-border/40 pb-1">
                  <span>Stateful Drift Delta (T0 Baseline vs T1 Current)</span>
                  <span className="text-primary font-semibold">3 Delta Events</span>
                </div>
                <div className="space-y-2 text-[11px] font-mono">
                  <div className="border border-destructive/40 bg-destructive/10 p-2">
                    <span className="font-bold text-destructive">[CRITICAL DRIFT] EXPIRED_CERT: legacy.aiori.lab</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">T0: Active / Valid | T1: Expired (-292 days overdue)</p>
                  </div>
                  <div className="border border-amber-500/40 bg-amber-500/10 p-2">
                    <span className="font-bold text-amber-400">[HIGH DRIFT] NEW_SERVICE: dev-edge.aiori.lab:8080</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">T0: Port 8080 Filtered | T1: Port 8080 OPEN (Werkzeug debug console)</p>
                  </div>
                  <div className="border border-destructive/40 bg-destructive/10 p-2">
                    <span className="font-bold text-destructive">[HIGH DRIFT] DANGLING_DNS: test-s3.aiori.lab</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">T0: Active cloud target | T1: Deprovisioned bucket (HTTP 404 NoSuchBucket)</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "merkle" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10.5px] uppercase tracking-wider text-primary border-b border-border/40 pb-1">
                  <span>Cryptographic Merkle Baseline Attestation</span>
                  <span className="text-muted-foreground">SHA-256 Provenance</span>
                </div>
                <pre className="border border-border/80 bg-background/80 p-3 font-mono text-[10.5px] leading-snug text-foreground/90 overflow-x-auto">
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
          </div>
        </div>
      </div>
    </section>
  );
}
