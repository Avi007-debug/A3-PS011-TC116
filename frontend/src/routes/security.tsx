import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/sentinel/Nav";
import { ScoreGauge } from "@/components/sentinel/ScoreGauge";
import { AttackSandbox } from "@/components/sentinel/AttackSandbox";
import { PqcMatrix } from "@/components/sentinel/PqcMatrix";
import { Footer } from "@/components/sentinel/Footer";
import { CliTerminalModal } from "@/components/sentinel/CliTerminalModal";
import { JudgeDefenseModal } from "@/components/sentinel/JudgeDefenseModal";
import { SupabaseSettingsModal } from "@/components/sentinel/SupabaseSettingsModal";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Perimeter Hygiene & Seeded Findings | ArgusASM" },
      {
        name: "description",
        content:
          "0-100 Perimeter Hygiene scoring with CVSS deductions, seeded-issue detection sandbox (expired certs, port 8080, dangling S3), and certificate posture matrix.",
      },
    ],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  const [isCliOpen, setIsCliOpen] = useState(false);
  const [isQaOpen, setIsQaOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [activeCliCmd, setActiveCliCmd] = useState<string | undefined>(undefined);

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
              <span className="text-primary font-bold">Perimeter Hygiene & Findings</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Perimeter Hygiene Scoring & Seeded-Fault Sandbox
            </h1>

            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              Audit external perimeter posture with defensible 0-100 scores across 4 dimensions: DNS zone hygiene, TLS certificates, permitted port exposure, and dangling CNAME integrity. Validate empirical detection of the 3 required seeded faults with automated safe remediation directives.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 font-mono text-xs">
              <a
                href="#score"
                className="hover-glow border border-border bg-background/80 px-3 py-1.5 transition-all hover:border-primary hover:bg-surface-raised cursor-pointer group flex items-center gap-1.5"
                title="Jump to 0-100 Perimeter Hygiene Scoring Engine"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">HYGIENE SCORE:</span>
                <strong className="text-amber-700 dark:text-amber-400 font-bold group-hover:underline">68 / 100 (Elevated Risk) ↓</strong>
              </a>
              <a
                href="#sandbox"
                className="hover-glow border border-border bg-background/80 px-3 py-1.5 transition-all hover:border-primary hover:bg-surface-raised cursor-pointer group flex items-center gap-1.5"
                title="Jump to Seeded-Fault Detection Sandbox & Remediation Advisor"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">SEEDED ISSUES:</span>
                <strong className="text-primary group-hover:underline">3 / 3 Verified ↓</strong>
              </a>
              <a
                href="#pqc"
                className="hover-glow border border-border bg-background/80 px-3 py-1.5 transition-all hover:border-primary hover:bg-surface-raised cursor-pointer group flex items-center gap-1.5"
                title="Jump to Certificate & Key Posture Matrix"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">SAFETY GUARANTEE:</span>
                <strong className="text-primary font-bold group-hover:underline">Zero Exploitation (Read-Only) ↓</strong>
              </a>
            </div>
          </div>
        </div>

        {/* 0-100 Perimeter Hygiene Scoring Engine */}
        <ScoreGauge />

        {/* Seeded Fault Harness & Safe Remediation Advisor */}
        <AttackSandbox />

        {/* Certificate & Key Posture Matrix */}
        <PqcMatrix />
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
