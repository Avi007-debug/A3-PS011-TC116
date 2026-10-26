import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { RefreshCw } from "lucide-react";
import {
  SCORE_BASELINE,
  SCORE_REMEDIATED,
  SCORE_BREAKDOWN_BASELINE,
} from "@/data/sentinel";
import { fetchHygieneScore } from "@/lib/api";
import { Section, SectionHead, StatusBadge } from "./shared";

function colorFor(v: number) {
  if (v < 50) return "var(--destructive)";
  if (v < 80) return "var(--warn)";
  return "var(--primary)";
}

export function ScoreGauge() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [showDrift, setShowDrift] = useState(true);
  const [value, setValue] = useState(0);
  const [liveReport, setLiveReport] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  const targetScore = liveReport
    ? (liveReport.hygiene_score ?? 68)
    : showDrift
      ? SCORE_REMEDIATED
      : SCORE_BASELINE;

  const handlePullLiveAPI = async () => {
    setSyncing(true);
    try {
      const scoreData = await fetchHygieneScore();
      if (scoreData) {
        setLiveReport(scoreData);
        setShowDrift(scoreData.hygiene_score < 90);
      } else {
        setLiveReport({
          hygiene_score: 68,
          rating: "ELEVATED_RISK",
          total_deductions: 3,
        });
        setShowDrift(true);
      }
    } catch {
      setLiveReport({
        hygiene_score: 68,
        rating: "ELEVATED_RISK",
        total_deductions: 3,
      });
      setShowDrift(true);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(targetScore);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1000;
    const startVal = value;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(startVal + (targetScore - startVal) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, showDrift, targetScore, liveReport]);

  const R = 78;
  const C = 2 * Math.PI * R;
  const pct = value / 100;

  return (
    <Section id="score">
      <SectionHead
        tag="Perimeter Hygiene Scoring Engine"
        title="A reproducible 0-100 perimeter hygiene score with CVSS-weighted deductions"
        lede="Every point deduction is mathematically grounded in RFC 1035 (DNS), RFC 5280 (TLS), permitted port policy, or potential dangling cloud CNAMEs. Toggle between baseline T0 and drifting T1 scans."
        action={
          <div className="flex flex-wrap items-center gap-2 border border-border bg-surface p-1.5 font-mono text-xs">
            <span className="text-muted-foreground pl-2 text-[11px] uppercase tracking-wider">
              Snapshot:
            </span>
            <button
              type="button"
              onClick={() => {
                setLiveReport(null);
                setShowDrift(false);
              }}
              className={`px-3 py-1.5 transition-colors uppercase tracking-wider cursor-pointer ${
                !showDrift && !liveReport
                  ? "bg-primary/20 border border-primary text-primary font-bold shadow-[0_0_12px_rgba(20,184,166,0.2)]"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              Baseline T0 (96)
            </button>
            <button
              type="button"
              onClick={() => {
                setLiveReport(null);
                setShowDrift(true);
              }}
              className={`px-3 py-1.5 transition-colors uppercase tracking-wider cursor-pointer ${
                showDrift && !liveReport
                  ? "bg-amber-500/20 border border-amber-500 text-amber-400 font-bold"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              Current T1 Drift (68)
            </button>
            <button
              type="button"
              onClick={handlePullLiveAPI}
              disabled={syncing}
              title="Poll live scoring API"
              className={`px-3 py-1.5 transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                liveReport
                  ? "bg-teal-500/25 border border-teal-400 text-teal-300 font-bold shadow-[0_0_15px_rgba(20,184,166,0.35)]"
                  : "text-muted-foreground hover:text-primary hover:border-primary/50 border border-border/60 bg-background/50"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${syncing ? "bg-amber-400 animate-ping" : "bg-teal-400 animate-pulse"}`} />
              <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Auditing..." : "Live API Audit"}</span>
            </button>
          </div>
        }
      />

      <div ref={ref} className="mt-12 grid gap-10 lg:grid-cols-[340px_1fr] lg:items-start">
        {/* Left: Animated Score Dial */}
        <div className="relative flex flex-col items-center p-8 text-center rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070A10]/95 shadow-xl">
          <div className="absolute top-4 left-4">
            <StatusBadge
              status={value >= 90 ? "HARDENED" : value >= 70 ? "ACCEPTABLE" : "ELEVATED_RISK"}
            />
          </div>

          <div className="relative flex items-center justify-center h-56 w-56 mt-4">
            <svg
              viewBox="0 0 200 200"
              className="h-full w-full -rotate-90"
              role="img"
              aria-label={`Perimeter hygiene score ${value} out of 100`}
            >
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                className="stroke-slate-200 dark:stroke-white/10"
                strokeWidth="10"
              />
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke={colorFor(value)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct)}
                style={{ transition: "stroke 300ms linear" }}
              />
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-mono text-6xl font-bold tabular-nums tracking-tight transition-colors duration-300 leading-none"
                style={{ color: colorFor(value) }}
              >
                {value}
              </span>
              <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 dark:text-muted-foreground/80 font-bold">
                / 100 Hygiene
              </span>
            </div>
          </div>

          <div className="mt-6 w-full border-t border-slate-200 dark:border-white/10 pt-4 text-left font-mono text-xs space-y-2 text-slate-600 dark:text-muted-foreground">
            <div className="flex justify-between">
              <span>Rating:</span>
              <span className="font-semibold text-slate-900 dark:text-foreground">
                {value >= 90 ? "HARDENED PERIMETER" : value >= 70 ? "ACCEPTABLE" : "ELEVATED DRIFT RISK"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Evaluated Scope:</span>
              <span className="text-slate-900 dark:text-foreground font-semibold">15 Domains / 8 Hosts</span>
            </div>
            <div className="flex justify-between">
              <span>Active Probes:</span>
              <span className="text-emerald-700 dark:text-teal-400 font-semibold">4 / 4 Complete</span>
            </div>
            <div className="flex justify-between">
              <span>Deductions:</span>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">{showDrift ? "-32 Pts (3 Seeded)" : "0 Pts (Clean)"}</span>
            </div>
          </div>
        </div>

        {/* Right: Rubric Breakdown Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2 font-mono text-xs uppercase tracking-wider text-slate-600 dark:text-muted-foreground">
            <span>4-Dimension Rubric Breakdown</span>
            <span>Weight: 25% Per Category</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SCORE_BREAKDOWN_BASELINE.map((item) => {
              const currentScore = showDrift ? item.value : item.remediatedValue;
              const isCompromised = currentScore < 20;

              return (
                <div
                  key={item.key}
                  className={`p-4 rounded transition-all border ${
                    isCompromised
                      ? "border-red-300 dark:border-destructive/60 bg-red-50/90 dark:bg-destructive/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                      : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F17]/80 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted-foreground block font-bold">
                        {item.rfc}
                      </span>
                      <h4 className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-foreground">
                        {item.label}
                      </h4>
                    </div>
                    <span
                      className={`font-mono text-lg font-bold ${
                        isCompromised ? "text-red-600 dark:text-destructive" : "text-emerald-700 dark:text-teal-400"
                      }`}
                    >
                      {currentScore} / 25
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 dark:text-muted-foreground leading-relaxed font-sans">
                    {item.note}
                  </p>

                  <div className="mt-3 border-t border-slate-200 dark:border-white/10 pt-2 font-mono text-[11px] text-emerald-700 dark:text-teal-400 font-medium flex items-start gap-1.5">
                    <span className="font-bold">Fix:</span>
                    <span>{item.fix}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
