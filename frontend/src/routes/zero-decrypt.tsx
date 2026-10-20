import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/sentinel/Nav";
import { Classification } from "@/components/sentinel/Classification";
import { Footer } from "@/components/sentinel/Footer";
import { CliTerminalModal } from "@/components/sentinel/CliTerminalModal";
import { JudgeDefenseModal } from "@/components/sentinel/JudgeDefenseModal";
import { SupabaseSettingsModal } from "@/components/sentinel/SupabaseSettingsModal";

export const Route = createFileRoute("/zero-decrypt")({
  head: () => ({
    meta: [
      { title: "Drift Timeline & Snapshot Diff | ArgusASM" },
      {
        name: "description",
        content:
          "Stateful baseline comparison (T0 vs T1) tracking perimeter additions, removals, expired certs, and shadow open ports with historical timeline scrubbing.",
      },
    ],
  }),
  component: DriftTimelinePage,
});

function DriftTimelinePage() {
  const [isCliOpen, setIsCliOpen] = useState(false);
  const [isQaOpen, setIsQaOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [activeCliCmd, setActiveCliCmd] = useState<string | undefined>(undefined);
  const [timeTravelStep, setTimeTravelStep] = useState<"T0" | "T1" | "T2">("T1");

  const handleOpenCliWithCmd = (cmd?: string) => {
    setActiveCliCmd(cmd);
    setIsCliOpen(true);
  };

  return (
    <div className="page-enter min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      <Nav
        onOpenCli={() => handleOpenCliWithCmd()}
        onOpenQa={() => setIsQaOpen(true)}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
      />

      <main className="pt-24">
        {/* Page Hero Header */}
        <div className="border-b border-border/80 bg-surface/50 px-5 py-12 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
              <span>ArgusASM Sentinel</span>
              <span>/</span>
              <span className="text-primary font-bold">Drift Timeline & Snapshot Diff</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Stateful Perimeter Drift Timeline & Delta Engine
            </h1>

            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              Compare the baseline inventory snapshot (T0) with subsequent scans (T1). ArgusASM mathematically identifies new services, expired TLS certificates, and potential dangling CNAME records with full provenance, timestamps, and evidence.
            </p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="border border-border bg-background/80 p-3">
                <span className="text-muted-foreground block text-[10.5px]">BASELINE STATE</span>
                <strong className="text-primary text-base">T0 Clean (96 pts)</strong>
              </div>
              <div className="border border-border bg-background/80 p-3">
                <span className="text-muted-foreground block text-[10.5px]">CURRENT SNAPSHOT</span>
                <strong className="text-amber-700 dark:text-amber-400 text-base">T1 Drift (68 pts)</strong>
              </div>
              <div className="border border-border bg-background/80 p-3">
                <span className="text-muted-foreground block text-[10.5px]">DETECTED DRIFTS</span>
                <strong className="text-destructive text-base">3 Fault Events</strong>
              </div>
              <div className="border border-border bg-background/80 p-3">
                <span className="text-muted-foreground block text-[10.5px]">PROVENANCE</span>
                <strong className="text-primary text-base">SHA-256 Merkle Chain</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Time-Travel Historical Scrubber Control */}
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-12">
          <div className="panel border border-primary/50 bg-surface/90 p-6 shadow-xl font-mono">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
              <div>
                <span className="text-xs uppercase text-primary font-bold tracking-wider">[Time-Travel Scrubber]</span>
                <h3 className="text-lg font-bold text-foreground">Historical Snapshot Timeline</h3>
              </div>
              <div className="flex gap-2">
                {(["T0", "T1", "T2"] as const).map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setTimeTravelStep(step)}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                      timeTravelStep === step
                        ? "border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(20,184,166,0.3)]"
                        : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {step === "T0" ? "T0: Day 1 Baseline" : step === "T1" ? "T1: Day 5 Drift" : "T2: Day 10 Remediated"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3 text-xs">
              <div className={`p-4 border ${timeTravelStep === "T0" ? "border-primary bg-primary/10" : "border-border/60 bg-background/40"}`}>
                <span className="font-bold text-primary block">T0: Baseline Clean Inventory</span>
                <p className="text-muted-foreground mt-1">15 approved domains and 8 hosts cataloged. All certs valid. Ports restricted strictly to whitelist [22, 53, 80, 443].</p>
                <div className="mt-3 text-[11px] font-bold text-foreground">Score: 96/100 · 0 Drift Events</div>
              </div>

              <div className={`p-4 border ${timeTravelStep === "T1" ? "border-destructive bg-destructive/10" : "border-border/60 bg-background/40"}`}>
                <span className="font-bold text-destructive block">T1: Seeded Fault Drift</span>
                <p className="text-muted-foreground mt-1">Expired cert on legacy.aiori.lab (-35), shadow port 8080 opened on dev-edge.aiori.lab (-25), dangling S3 CNAME on test-s3.aiori.lab (-30).</p>
                <div className="mt-3 text-[11px] font-bold text-destructive">Score: 68/100 · 3 Drift Events</div>
              </div>

              <div className={`p-4 border ${timeTravelStep === "T2" ? "border-primary bg-primary/10" : "border-border/60 bg-background/40"}`}>
                <span className="font-bold text-primary block">T2: Remediated State</span>
                <p className="text-muted-foreground mt-1">Certbot renewed certificate, UFW port 8080 blocked, orphaned Route53 CNAME deleted. Perimeter restored to hardened state.</p>
                <div className="mt-3 text-[11px] font-bold text-primary">Score: 96/100 · 0 Active Risks</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Documented Probes Inspector */}
        <Classification />
      </main>

      <Footer />

      {/* Interactive Modals */}
      <CliTerminalModal
        isOpen={isCliOpen}
        onClose={() => setIsCliOpen(false)}
        initialCmd={activeCliCmd}
      />

      <JudgeDefenseModal
        open={isQaOpen}
        onClose={() => setIsQaOpen(false)}
      />

      <SupabaseSettingsModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
      />
    </div>
  );
}
