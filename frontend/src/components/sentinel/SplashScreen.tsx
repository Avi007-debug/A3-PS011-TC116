import { useEffect, useState, useRef } from "react";

// ─── Boot sequence log lines ───────────────────────────────────────────────
const BOOT_LINES = [
  { delay: 0,    text: "ARGUSASM ATTACK-SURFACE SENTINEL v1.0.0" },
  { delay: 120,  text: "──────────────────────────────────────────────" },
  { delay: 240,  text: "[ OK ] Scope Safety Enforcer: max 20 domains / 10 hosts" },
  { delay: 380,  text: "[ OK ] Check 1: DNS Inventory probe compiled (RFC 1035)" },
  { delay: 520,  text: "[ OK ] Check 2: TLS Certificate inspector active (RFC 5280)" },
  { delay: 660,  text: "[ OK ] Check 3: Permitted ports whitelist loaded [22,53,80,443,8080]" },
  { delay: 800,  text: "[ OK ] Check 4: Dangling DNS cloud fingerprints indexed" },
  { delay: 940,  text: "[ OK ] Stateful Drift Engine: baseline delta engine warm" },
  { delay: 1080, text: "[ OK ] SHA-256 Merkle ledger: tamper-evident root ready" },
  { delay: 1200, text: "[ OK ] Non-Exploitation Policy: 100% read-only active" },
  { delay: 1340, text: "──────────────────────────────────────────────" },
  { delay: 1480, text: "SYSTEM: AIORI PS-011 · CYBERSECURITY & INFRASTRUCTURE" },
  { delay: 1620, text: "STATUS: ALL PROBES NOMINAL — LAUNCHING SENTINEL HUD…" },
];

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [progressPct, setProgressPct] = useState(0);
  const [phase, setPhase] = useState<"boot" | "fadeout">("boot");
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const total = 1900;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      setProgressPct(Math.min((elapsed / total) * 100, 100));
      if (elapsed < total) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((line, idx) => {
      const t = setTimeout(() => {
        setVisibleLines((prev) => [...prev, idx]);
      }, line.delay);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase("fadeout"), 2000);
    const doneTimer = setTimeout(() => onComplete(), 2600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`splash-root ${phase === "fadeout" ? "splash-fadeout" : ""}`}
      aria-label="ArgusASM system boot"
      aria-live="polite"
    >
      <div className="splash-grid" aria-hidden="true" />
      <div className="splash-orb" aria-hidden="true" />

      <div className="splash-terminal">
        <div className="splash-titlebar">
          <div className="splash-dots">
            <span className="splash-dot splash-dot--red" />
            <span className="splash-dot splash-dot--yellow" />
            <span className="splash-dot splash-dot--green" />
          </div>
          <span className="splash-titlebar-text">
            argus-sentinel-boot — bash — 80×24
          </span>
          <div />
        </div>

        <div className="splash-body">
          <pre className="splash-logo" aria-label="ArgusASM ASCII logo">
{`   ___                         _   ____  __  __ 
  / _ \\  _ __ __ _ _   _ ___   / \\ / ___||  \\/  |
 / /_\\ \\| '__/ _\` | | | / __| / _ \\\\___ \\| |\\/| |
/ /_\\\\ \\| | | (_| | |_| \\__ \\/ ___ \\___) | |  | |
\\____/\\_|_|  \\__, |\\__,_|___/_/   \\_\\____/|_|  |_|
             |___/                                `}
          </pre>
          <p className="splash-subtitle">
            Autonomous Attack-Surface Inventory &amp; Drift Sentinel
          </p>
          <div className="splash-divider" />

          <div className="splash-lines" role="log">
            {BOOT_LINES.map((line, idx) => (
              <div
                key={idx}
                className={`splash-line ${visibleLines.includes(idx) ? "splash-line--visible" : ""}`}
              >
                <span className="splash-prompt">$ </span>
                <span
                  className={
                    line.text.startsWith("[ OK ]")
                      ? "splash-ok"
                      : line.text.startsWith("STATUS")
                      ? "splash-status"
                      : line.text.startsWith("SYSTEM")
                      ? "splash-system"
                      : line.text.startsWith("──")
                      ? "splash-divider-line"
                      : "splash-heading"
                  }
                >
                  {line.text}
                </span>
              </div>
            ))}
          </div>

          <div className="splash-progress-wrap" role="progressbar" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="splash-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="splash-progress-label">
            INITIALIZING… {Math.round(progressPct)}%
          </p>
        </div>
      </div>

      <p className="splash-badge">
        AIORI Hackathon 2026 · Problem Statement PS-011 · Track: Cybersecurity &amp; Infrastructure
      </p>
    </div>
  );
}
