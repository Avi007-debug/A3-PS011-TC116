import { useEffect, useState, useRef } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

interface SentinelNode {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  type: "domain" | "host" | "service" | "fault";
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"scan" | "reveal" | "fadeout">("scan");
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const STEPS = [
    "ACQUIRING PERIMETER COORDINATES…",
    "VERIFYING SCOPE LIMITS (20 DOMAINS / 10 HOSTS)…",
    "ARMING RFC 1035 & RFC 5280 SENSORS…",
    "SYNCHRONIZING SHA-256 MERKLE ANCHOR…",
    "SENTINEL ONLINE · ZERO EXPLOITATION LOCKED",
  ];

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        onComplete();
      }
    }
  }, [onComplete]);

  // Overall timing: 1.8s total
  useEffect(() => {
    const start = performance.now();
    const duration = 1800;

    const interval = setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      const stepIdx = Math.min(Math.floor((elapsed / duration) * STEPS.length), STEPS.length - 1);
      setActiveStep(stepIdx);

      if (elapsed >= 1100 && phase === "scan") {
        setPhase("reveal");
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        setPhase("fadeout");
        setTimeout(() => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("argus_sentinel_seen", "true");
          }
          onComplete();
        }, 400);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete, phase]);

  // Canvas radar animation: technical grid, connected nodes, circular scanning arc
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Seeded sentinel nodes representing the approved scope
    const nodes: SentinelNode[] = [
      { id: "1", label: "aiori.lab", x: 0.32, y: 0.38, r: 4.5, type: "domain" },
      { id: "2", label: "api.aiori.lab", x: 0.68, y: 0.32, r: 4, type: "service" },
      { id: "3", label: "10.0.1.10", x: 0.25, y: 0.62, r: 3.5, type: "host" },
      { id: "4", label: "legacy.aiori.lab", x: 0.72, y: 0.66, r: 5, type: "fault" },
      { id: "5", label: "dev-edge.aiori.lab", x: 0.52, y: 0.78, r: 4, type: "fault" },
      { id: "6", label: "test-s3.aiori.lab", x: 0.45, y: 0.22, r: 4, type: "fault" },
      { id: "7", label: "mail.aiori.lab", x: 0.18, y: 0.42, r: 3, type: "domain" },
      { id: "8", label: "vpn.aiori.lab", x: 0.82, y: 0.48, r: 3.5, type: "domain" },
    ];

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(w, h) * 0.44;

      // 1. Subtle technical coordinate grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 2. Concentric observatory radar rings
      [0.25, 0.5, 0.75, 1].forEach((fraction) => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius * fraction, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(20, 184, 166, 0.08)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Crosshairs
      ctx.strokeStyle = "rgba(20, 184, 166, 0.12)";
      ctx.beginPath();
      ctx.moveTo(cx - maxRadius, cy);
      ctx.lineTo(cx + maxRadius, cy);
      ctx.moveTo(cx, cy - maxRadius);
      ctx.lineTo(cx, cy + maxRadius);
      ctx.stroke();

      // 3. Circular scanning arc (radar sweep in fiery orange & amber beacon)
      angle += 0.045;
      const arcSpread = Math.PI / 3; // 60 degrees

      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, maxRadius);
      grad.addColorStop(0, "rgba(255, 122, 0, 0.32)");
      grad.addColorStop(0.6, "rgba(251, 188, 4, 0.16)");
      grad.addColorStop(1, "rgba(255, 122, 0, 0.01)");

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadius, angle - arcSpread, angle);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Leading edge ray of the sweep
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius);
      ctx.strokeStyle = "rgba(255, 122, 0, 0.85)";
      ctx.lineWidth = 1.75;
      ctx.stroke();
      ctx.restore();

      // 4. Inter-node connection lines
      for (let i = 0; i < nodes.length; i++) {
        const ni = nodes[i];
        if (!ni) continue;
        const nix = ni.x * w;
        const niy = ni.y * h;

        for (let j = i + 1; j < nodes.length; j++) {
          const nj = nodes[j];
          if (!nj) continue;
          const njx = nj.x * w;
          const njy = nj.y * h;

          const dist = Math.hypot(nix - njx, niy - njy);
          if (dist < 260) {
            ctx.beginPath();
            ctx.moveTo(nix, niy);
            ctx.lineTo(njx, njy);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // 5. Render nodes
      nodes.forEach((node) => {
        const nx = node.x * w;
        const ny = node.y * h;

        // Check distance from radar sweep leading edge
        const nodeAngle = (Math.atan2(ny - cy, nx - cx) + Math.PI * 2) % (Math.PI * 2);
        const currentAngleNorm = (angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const diff = Math.abs(nodeAngle - currentAngleNorm);
        const isSwept = diff < 0.25 || diff > Math.PI * 2 - 0.25;

        ctx.beginPath();
        ctx.arc(nx, ny, node.r, 0, Math.PI * 2);

        if (node.type === "fault") {
          ctx.fillStyle = isSwept ? "#EF4444" : "rgba(239, 68, 68, 0.6)";
          ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        } else {
          ctx.fillStyle = isSwept ? "#2DD4BF" : "rgba(20, 184, 166, 0.6)";
          ctx.strokeStyle = "rgba(20, 184, 166, 0.4)";
        }
        ctx.fill();

        if (isSwept) {
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Technical node label
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.fillStyle = isSwept ? "#F0F3F6" : "rgba(148, 163, 184, 0.6)";
        ctx.fillText(node.label, nx + 8, ny + 3);
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07090E] text-foreground transition-opacity duration-500 select-none ${
        phase === "fadeout" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="ArgusASM Sentinel Initializing"
      role="status"
    >
      {/* Background Radar Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,#07090E_85%)]"
        aria-hidden="true"
      />

      {/* Center Observatory Reticle & Brand Identity */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-lg">
        {/* Emblem with Fiery Beacon Glow */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-xl border border-orange-500/40 bg-[#0B0F17]/90 p-3 shadow-[0_0_50px_rgba(255,122,0,0.45)] backdrop-blur-md">
          <div className="absolute inset-0 rounded-xl border border-orange-400/30 animate-ping opacity-35" />
          <img
            src="/logo.png"
            alt="ArgusASM"
            className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(255,122,0,0.75)]"
          />
        </div>

        {/* Wordmark */}
        <div className="mt-5 flex items-baseline gap-1.5 font-mono">
          <span className="text-3xl font-extrabold tracking-widest text-[#F0F3F6] sm:text-4xl">
            ARGUS<span className="text-orange-400">ASM</span>
          </span>
          <span className="rounded border border-orange-500/40 bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">
            v1.0
          </span>
        </div>

        {/* Official Tagline */}
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8B949E] sm:text-sm font-sans">
          Continuous Visibility. Zero Exploitation. Provable Drift.
        </p>

        {/* Real-time Sentinel Step Output */}
        <div className="mt-8 flex items-center gap-2 rounded border border-white/10 bg-[#0E131F]/90 px-4 py-2 font-mono text-[11px] text-teal-300 shadow-lg backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="tracking-wider">{STEPS[activeStep]}</span>
        </div>

        {/* Editorial Scope Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 font-mono text-[9.5px] uppercase tracking-wider text-[#7D8590]">
          <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">PS-011 COMPLIANT</span>
          <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">MAX 20 DOMAINS / 10 HOSTS</span>
          <span className="border border-teal-500/30 bg-teal-500/5 text-teal-400 px-2 py-0.5">
            NON-EXPLOITATIVE
          </span>
        </div>
      </div>

      {/* Progress Bar Along Bottom */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 transition-all duration-75 shadow-[0_0_12px_rgba(20,184,166,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
