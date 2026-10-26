import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/sentinel/Nav";
import { BlockchainAudit } from "@/components/sentinel/BlockchainAudit";
import { OsintInvestigationDossier } from "@/components/sentinel/OsintInvestigationDossier";
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
              <a
                href="#ledger"
                className="hover-glow border border-border bg-background/80 px-3 py-1.5 transition-all hover:border-primary hover:bg-surface-raised cursor-pointer group flex items-center gap-1.5"
                title="Jump to Merkle Tree Blockchain Audit Visualizer"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">LEDGER:</span>
                <strong className="text-foreground group-hover:underline">SHA-256 Merkle Audit Chain ↓</strong>
              </a>
              <a
                href="#dossier"
                className="hover-glow border border-border bg-background/80 px-3 py-1.5 transition-all hover:border-primary hover:bg-surface-raised cursor-pointer group flex items-center gap-1.5"
                title="Jump to OSINT Evidence Dossier & Cryptographic Receipts"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">ATTESTATION:</span>
                <strong className="text-primary group-hover:underline">Verified Tamper-Free ↓</strong>
              </a>
              <a
                href="#roadmap"
                className="hover-glow border border-border bg-background/80 px-3 py-1.5 transition-all hover:border-primary hover:bg-surface-raised cursor-pointer group flex items-center gap-1.5"
                title="Jump to PS-011 Audit Compliance Roadmap"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">COMPLIANCE:</span>
                <strong className="text-primary font-bold group-hover:underline">PS-011 Audit Standard ↓</strong>
              </a>
            </div>
          </div>
        </div>

        {/* Blockchain Audit & Merkle Proof Visualizer */}
        <BlockchainAudit />

        {/* Forensics Evidence Dossier & Raw Probe Captures (Image 2) */}
        <section id="dossier" className="px-5 py-8 sm:px-8 lg:px-12 bg-background border-t border-border/80">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4">
              <span className="border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary uppercase tracking-wider font-mono">
                Cryptographic Evidence Dossier
              </span>
              <h2 className="text-2xl font-bold font-mono tracking-tight text-foreground mt-2">
                OSINT Probe Captures & Forensics Receipts
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Raw DNS zone transfer grabs, X.509 TLS handshake certificates, and HTTP response headers anchored with SHA-256 hashes.
              </p>
            </div>
            <OsintInvestigationDossier />
          </div>
        </section>

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
