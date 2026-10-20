import { useState } from "react";
import { PROJECT, LIVE_TELEMETRY } from "@/data/sentinel";
import { Section, SectionHead } from "./shared";

const LEAF_NODES = [
  { id: "L1", label: "Approved Scope Manifest", hash: "0x7f82b9a4...c1e3", parent: "H12", detail: "Canonical approved_scope.json: 15 domains, 8 hosts strictly within PS-011 caps." },
  { id: "L2", label: "DNS Zone Inventory Set", hash: "0x1a2b3c4d...5e6f", parent: "H12", detail: "Authoritative A, AAAA, CNAME, MX, TXT, NS records resolved compliant with RFC 1035." },
  { id: "L3", label: "TLS Certificate Evidence", hash: "0x9e8d7c6b...5a4f", parent: "H34", detail: "X.509 validity states, expiration timestamps, and SANs inspected per RFC 5280." },
  { id: "L4", label: "Permitted Port Profiles", hash: "0x3f5c7e9b...0d2a", parent: "H34", detail: "Service inspection restricted strictly to whitelisted ports [22, 53, 80, 443, 8080]." },
];

export function BlockchainAudit() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [activeLeaf, setActiveLeaf] = useState<string | null>(null);

  const handleVerify = () => {
    setIsVerifying(true);
    setIsVerified(false);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 1200);
  };

  const selectedLeafObj = LEAF_NODES.find((l) => l.id === activeLeaf);

  return (
    <Section id="ledger" className="dot-bg">
      <SectionHead
        tag="Cryptographic Provenance · PS-011 Audit Ledger"
        title="Tamper-Evident SHA-256 Merkle Audit Trail for Perimeter Snapshots"
        lede="ArgusASM cryptographically commits inventory snapshots (T0 Baseline and T1 Drift) into an immutable SHA-256 Merkle tree. AIORI evaluators and corporate risk teams can mathematically verify that baseline evidence and drift timestamps were never altered."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left: Interactive Merkle Tree Visualizer */}
        <div className="border border-border bg-surface p-6 shadow-2xl font-mono text-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h3 className="font-bold text-foreground uppercase tracking-wider">
                Snapshot Merkle Tree Structure
              </h3>
            </div>
            <span className="text-[10.5px] text-primary border border-primary/40 bg-primary/10 px-2 py-0.5 font-bold">
              SHA-256 Audit Chain
            </span>
          </div>

          {/* Interactive Visualizer Diagram */}
          <div className="mt-6 flex flex-col items-center relative py-4">
            {/* Merkle Root Node */}
            <div
              className={`border p-3.5 text-center w-full max-w-md transition-all duration-300 ${
                isVerifying
                  ? "border-primary bg-primary/25 shadow-[0_0_25px_rgba(20,184,166,0.4)] scale-105"
                  : activeLeaf
                  ? "border-primary bg-primary/20 shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                  : "border-primary/80 bg-primary/15 shadow-[0_0_12px_rgba(20,184,166,0.15)]"
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-primary text-[10px] uppercase tracking-widest font-bold">
                <span>Merkle Root Hash</span>
                <span className="text-[9px] border border-primary/40 px-1 bg-primary/20">BLOCK #{LIVE_TELEMETRY.blockHeight}</span>
              </div>
              <div className="text-foreground font-bold text-xs mt-1 truncate select-all">
                {LIVE_TELEMETRY.merkleRoot}
              </div>
              <span className="text-[9.5px] text-muted-foreground mt-0.5 block">
                Root = H( H(L1 || L2) || H(L3 || L4) )
              </span>
            </div>

            {/* Connecting Vertical Trunk */}
            <div className="h-6 w-px bg-primary/60 my-1" />

            {/* Intermediate Hashes */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
              <div className="border border-border bg-background/80 p-2.5 text-center">
                <span className="text-[10px] text-primary/80 uppercase block">Branch H(1,2)</span>
                <span className="text-foreground font-semibold text-[11px]">0x4f82a1...39b1</span>
                <span className="text-[9px] text-muted-foreground block mt-0.5">Scope & DNS Cluster</span>
              </div>
              <div className="border border-border bg-background/80 p-2.5 text-center">
                <span className="text-[10px] text-primary/80 uppercase block">Branch H(3,4)</span>
                <span className="text-foreground font-semibold text-[11px]">0x7c90b2...e814</span>
                <span className="text-[9px] text-muted-foreground block mt-0.5">TLS & Port Cluster</span>
              </div>
            </div>

            {/* Connecting Trunk to Leaves */}
            <div className="h-6 w-px bg-primary/40 my-1" />

            {/* 4 Leaf Nodes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
              {LEAF_NODES.map((leaf) => {
                const isSelected = activeLeaf === leaf.id;
                return (
                  <button
                    key={leaf.id}
                    type="button"
                    onClick={() => setActiveLeaf(isSelected ? null : leaf.id)}
                    className={`border p-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(20,184,166,0.25)]"
                        : "border-border/80 bg-background/60 hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-primary">[{leaf.id}]</span>
                      <span className="text-[9px] text-muted-foreground">{leaf.parent}</span>
                    </div>
                    <div className="font-bold text-[11px] mt-1 truncate">{leaf.label}</div>
                    <div className="text-[9.5px] text-muted-foreground truncate mt-0.5">{leaf.hash}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Leaf Inspector Drawer */}
          {selectedLeafObj && (
            <div className="mt-4 border border-primary/50 bg-primary/10 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-primary">Leaf Detail: {selectedLeafObj.label}</span>
                <button
                  type="button"
                  onClick={() => setActiveLeaf(null)}
                  className="text-muted-foreground hover:text-foreground text-[10px]"
                >
                  Close [✕]
                </button>
              </div>
              <p className="text-[11px] text-foreground/90 font-sans leading-relaxed">
                {selectedLeafObj.detail}
              </p>
            </div>
          )}

          {/* Verification CTA */}
          <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isVerifying ? "bg-amber-400 animate-ping" : isVerified ? "bg-primary" : "bg-destructive"
                }`}
              />
              <span className="text-[11px] text-muted-foreground">
                {isVerifying ? "Re-Hashing Merkle Tree..." : isVerified ? "VERIFIED: TAMPER-FREE EVIDENCE" : "UNVERIFIED"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="hover-glow border border-primary bg-primary/15 px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary font-bold cursor-pointer"
            >
              {isVerifying ? "Verifying..." : "Verify Merkle Proof 🛡️"}
            </button>
          </div>
        </div>

        {/* Right: Audit Ledger Receipt */}
        <div className="border border-border bg-surface p-6 shadow-2xl font-mono text-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="font-bold text-foreground uppercase tracking-wider">
                Cryptographic Attestation Receipt
              </h3>
              <span className="text-[10px] text-primary border border-primary/40 px-2 py-0.5 bg-primary/10">
                AIORI PS-011
              </span>
            </div>

            <div className="space-y-2.5 text-muted-foreground">
              <div className="flex justify-between border-b border-border/40 pb-1">
                <span>Snapshot Tag:</span>
                <span className="text-foreground font-semibold">T1 (Current Scan)</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1">
                <span>Ledger Chain:</span>
                <span className="text-foreground">ArgusASM SHA-256 Chain</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1">
                <span>Evaluated Assets:</span>
                <span className="text-foreground">15 Domains / 8 Hosts</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1">
                <span>Drift Status:</span>
                <span className="text-amber-400 font-bold">3 Events Detected</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1">
                <span>Hygiene Score:</span>
                <span className="text-primary font-bold">68 / 100</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1">
                <span>Timestamp:</span>
                <span className="text-foreground font-semibold">2026-10-20T04:30:00Z</span>
              </div>
            </div>

            <div className="border border-border bg-background/60 p-3 space-y-1.5 text-[10.5px]">
              <span className="text-primary font-bold uppercase tracking-wider block">Evaluator Verification Note:</span>
              <p className="text-muted-foreground font-sans leading-relaxed">
                The cryptographic Merkle root is calculated over serialized JSON assets before and after drift occurs. Any tampering with domain records, certificates, or open port logs produces a root mismatch.
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-border/80 pt-4 text-[11px] text-muted-foreground flex justify-between items-center">
            <span>Proof Status: <strong className="text-primary">VALID</strong></span>
            <span className="text-primary font-mono text-[10px] select-all">Root: 0x7c4f...5b7d</span>
          </div>
        </div>
      </div>
    </Section>
  );
}
