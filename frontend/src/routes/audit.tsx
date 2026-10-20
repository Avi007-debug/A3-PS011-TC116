import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/sentinel/Nav";
import { BlockchainAudit } from "@/components/sentinel/BlockchainAudit";
import { Roadmap } from "@/components/sentinel/Roadmap";
import { Team } from "@/components/sentinel/Team";
import { Footer } from "@/components/sentinel/Footer";
import { CliTerminalModal } from "@/components/sentinel/CliTerminalModal";
import { JudgeDefenseModal } from "@/components/sentinel/JudgeDefenseModal";
import { SupabaseSettingsModal } from "@/components/sentinel/SupabaseSettingsModal";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Merkle Baseline Ledger & Compliance Governance | ArgusASM" },
      {
        name: "description",
        content:
          "Cryptographic SHA-256 Merkle audit trail for perimeter snapshots, tamper-evident proof receipts, and AIORI Hackathon 2026 PS-011 engineering roadmap.",
      },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
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
              <span className="text-primary font-bold">Merkle Audit & Governance</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Cryptographic Merkle Baseline Ledger & Compliance Audit
            </h1>

            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              Cryptographically commit attack-surface baseline snapshots into an immutable SHA-256 Merkle tree. AIORI evaluators and cybersecurity auditors can mathematically verify that baseline evidence and drift timestamps were never modified retroactively.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 font-mono text-xs">
              <div className="border border-border bg-background/80 px-3 py-1.5">
                <span className="text-muted-foreground mr-2">LEDGER:</span>
                <strong className="text-foreground">SHA-256 Merkle Audit Chain</strong>
              </div>
              <div className="border border-border bg-background/80 px-3 py-1.5">
                <span className="text-muted-foreground mr-2">ATTESTATION:</span>
                <strong className="text-primary">Verified Tamper-Free</strong>
              </div>
              <div className="border border-border bg-background/80 px-3 py-1.5">
                <span className="text-muted-foreground mr-2">COMPLIANCE:</span>
                <strong className="text-primary font-bold">PS-011 Audit Standard</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Blockchain Audit & Merkle Proof Visualizer */}
        <BlockchainAudit />

        {/* Engineering Roadmap */}
        <Roadmap />

        {/* Technical Team & Roles */}
        <Team />
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
