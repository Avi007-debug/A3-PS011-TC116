import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/sentinel/Nav";
import { Features } from "@/components/sentinel/Features";
import { Architecture } from "@/components/sentinel/Architecture";
import { TechStack } from "@/components/sentinel/TechStack";
import { Footer } from "@/components/sentinel/Footer";
import { CliTerminalModal } from "@/components/sentinel/CliTerminalModal";
import { JudgeDefenseModal } from "@/components/sentinel/JudgeDefenseModal";
import { SupabaseSettingsModal } from "@/components/sentinel/SupabaseSettingsModal";

export const Route = createFileRoute("/capabilities")({
  head: () => ({
    meta: [
      { title: "Asset Inventory & 4 Probes | ArgusASM" },
      {
        name: "description",
        content:
          "ArgusASM Asset Inventory & Multi-Probe Architecture: 4 documented probes (DNS, TLS, Permitted Ports, Dangling DNS) backed by strict scope safety guardrails.",
      },
    ],
  }),
  component: CapabilitiesPage,
});

function CapabilitiesPage() {
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
              <span className="text-primary font-bold">Asset Inventory & Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Asset Inventory & 5-Stage Sentinel Architecture
            </h1>

            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              Explore ArgusASM&apos;s capabilities across scope guardrails, the 4 documented inspection probes (DNS, TLS, ports, dangling CNAMEs), and stateful baseline drift monitoring — supported by a 5-stage pipeline for AIORI Hackathon 2026 PS-011.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 font-mono text-xs">
              <div className="border border-border bg-background/80 px-3 py-1.5">
                <span className="text-muted-foreground mr-2">TIER 1:</span>
                <strong className="text-primary">Core Probes & Scope (3)</strong>
              </div>
              <div className="border border-border bg-background/80 px-3 py-1.5">
                <span className="text-muted-foreground mr-2">TIER 2:</span>
                <strong className="text-primary">Topology & Time-Travel (3)</strong>
              </div>
              <div className="border border-border bg-background/80 px-3 py-1.5">
                <span className="text-muted-foreground mr-2">TIER 3:</span>
                <strong className="text-primary">Merkle Audit & FP Filter (3)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Capabilities Explorer */}
        <Features onRunCli={handleOpenCliWithCmd} />

        {/* 5-Stage Pipeline Architecture */}
        <Architecture />

        {/* Engineering Technology Stack */}
        <TechStack />
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
