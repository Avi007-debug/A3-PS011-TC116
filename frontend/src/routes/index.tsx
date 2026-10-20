import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/sentinel/Nav";
import { Hero } from "@/components/sentinel/Hero";
import { ProblemSolution } from "@/components/sentinel/ProblemSolution";
import { Footer } from "@/components/sentinel/Footer";
import { CliTerminalModal } from "@/components/sentinel/CliTerminalModal";
import { JudgeDefenseModal } from "@/components/sentinel/JudgeDefenseModal";
import { SupabaseSettingsModal } from "@/components/sentinel/SupabaseSettingsModal";

const TITLE = "ArgusASM | Autonomous Attack-Surface & Drift Sentinel";
const DESC =
  "ArgusASM: Autonomous attack-surface inventory & drift sentinel for AIORI Hackathon 2026 PS-011. Continuous Visibility. Zero Exploitation. Provable Drift.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const EXPLORE_PORTALS = [
  {
    to: "/capabilities" as const,
    badge: "PS-011 Inventory",
    num: "01",
    accentClass: "border-l-success",
    title: "Asset Inventory & 4 Probes",
    desc: "Catalog approved domains, hosts, and authoritative DNS records. Inspect TLS certificates and audit permitted service ports with zero intrusive exploitation.",
    metrics: "15 Domains · 8 Hosts · Whitelisted Ports",
    cta: "Inspect Inventory →",
  },
  {
    to: "/drift" as const,
    badge: "Stateful Delta",
    num: "02",
    accentClass: "border-l-warn",
    title: "Drift Timeline & Snapshot Diff",
    desc: "Compare baseline snapshot T0 with subsequent scans. Inspect additions, removals, expired certs, and unexpected open services with historical timeline scrubbing.",
    metrics: "3 Drift Events · Seeded Fault Harness",
    cta: "Launch Drift Timeline →",
  },
  {
    to: "/security" as const,
    badge: "Hygiene Scoring",
    num: "03",
    accentClass: "border-l-primary",
    title: "Perimeter Hygiene & Seeded Findings",
    desc: "Evaluate the 0-100 posture score with CVSS-weighted deductions. Validate detection of expired certs, shadow port 8080, and dangling S3 CNAMEs with safe fix advisories.",
    metrics: "68 / 100 Score · CVSS 3.1 Rubric",
    cta: "View Posture & Findings →",
  },
  {
    to: "/audit" as const,
    badge: "Cryptographic Provenance",
    num: "04",
    accentClass: "border-l-primary",
    title: "Merkle Baseline Ledger & Audit Trail",
    desc: "Anchor inventory baseline snapshots to an immutable SHA-256 Merkle tree to mathematically certify evidence integrity and timestamps for AIORI evaluators.",
    metrics: "SHA-256 Merkle Chain · Tamper-Free Proof",
    cta: "Verify Merkle Proofs →",
  },
];

function HomePage() {
  const [isCliOpen, setIsCliOpen] = useState(false);
  const [isQaOpen, setIsQaOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [activeCliCmd, setActiveCliCmd] = useState<string | undefined>(undefined);

  const handleOpenCliWithCmd = (cmd?: string) => {
    setActiveCliCmd(cmd);
    setIsCliOpen(true);
  };

  return (
    <div id="top" className="page-enter min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      <Nav
        onOpenCli={() => handleOpenCliWithCmd()}
        onOpenQa={() => setIsQaOpen(true)}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
      />

      <main>
        {/* Hero Section */}
        <Hero />

        {/* Problem vs Solution Section */}
        <ProblemSolution />

        {/* Dedicated Explore Section: 4 High-Impact Platform Portals */}
        <section id="explore" className="border-t border-border/80 bg-surface/50 px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/80 pb-6 font-mono">
              <div>
                <span className="border border-primary/50 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                  Platform Exploration Hub
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Explore Dedicated ArgusASM Modules
                </h2>
                <p className="mt-2 text-sm text-muted-foreground font-sans max-w-2xl">
                  ArgusASM is architected into dedicated operational workspaces. Select a specialized module below for in-depth inventory inspection, stateful baseline drift, and cryptographic verification.
                </p>
              </div>

              <Link
                to="/qa"
                className="hover-glow border border-border bg-surface px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground"
              >
                Browse Methodology Dossier →
              </Link>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {EXPLORE_PORTALS.map((portal) => (
                <Link
                  key={portal.to}
                  to={portal.to}
                  className={`hover-glow group relative flex flex-col justify-between border border-border/80 border-l-2 ${portal.accentClass} bg-surface p-7 shadow-xl transition-all duration-200 hover:border-primary/60 hover:bg-surface-raised hover:shadow-[0_0_40px_rgba(20,184,166,0.08)] overflow-hidden`}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div>
                    <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span className="border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary font-bold">
                          {portal.badge}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-muted-foreground/60 tabular-nums">
                        [{portal.num}]
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {portal.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-sans">
                      {portal.desc}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-border/60 pt-4 flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground text-[11px] truncate mr-2">
                      {portal.metrics}
                    </span>
                    <span className="text-primary font-bold shrink-0 group-hover:translate-x-1 transition-transform">
                      {portal.cta}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Floating Speed-Dial */}
      <aside aria-label="Demo Controls" className="fixed bottom-5 right-5 z-40 flex items-center gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setIsQaOpen(true)}
          className="hover-glow flex items-center gap-1.5 border border-primary/80 bg-primary/20 px-4 py-2.5 font-bold text-primary shadow-[0_0_20px_rgba(20,184,166,0.3)] backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Methodology Dossier
        </button>
        <button
          type="button"
          onClick={() => handleOpenCliWithCmd()}
          title="Open CLI terminal"
          className="hover-glow flex items-center gap-1.5 border border-border bg-surface/90 px-3.5 py-2.5 text-muted-foreground shadow-xl backdrop-blur-md hover:text-foreground hover:border-primary/40 cursor-pointer"
        >
          &gt;_ CLI
        </button>
      </aside>

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
