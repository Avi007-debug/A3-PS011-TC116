import { useRef, useState } from "react";
import { useScroll, useTransform } from "motion/react";
import { Section, SectionHead } from "./shared";

const BEFORE_POINTS = [
  {
    title: "Unmaintained Subdomain Accumulation",
    desc: "Test and staging subdomains persist indefinitely after projects wrap up, with zero centralized visibility or ownership tracking.",
  },
  {
    title: "Silent TLS Certificate Expirations",
    desc: "Certificates expire silently on secondary endpoints, breaking browser trust chains and triggering urgent production outages.",
  },
  {
    title: "Shadow Services & Exposed Debug Ports",
    desc: "Developers open ad-hoc ports (e.g. 8080 debug consoles) that bypass perimeter firewalls and linger undetected for months.",
  },
  {
    title: "Dangling DNS / Subdomain Takeover Risk",
    desc: "Orphaned CNAME records pointing to decommissioned AWS S3, GitHub Pages, or Azure apps remain open to malicious registration.",
  },
  {
    title: "Dangerous Intrusive Scanners",
    desc: "Legacy vulnerability tools execute active exploitation, aggressive brute-forcing, and out-of-scope probing that crashes lab hosts.",
  },
];

const AFTER_POINTS = [
  {
    title: "Strict Approved Scope Management",
    desc: "Pre-flight safety enforcer strictly locks checks to the authorized 20-domain / 10-host cap with zero out-of-scope probing.",
  },
  {
    title: "Continuous 4-Probe Inspection",
    desc: "Automated non-intrusive checking across DNS (RFC 1035), TLS certificates (RFC 5280), permitted ports, and dangling CNAMEs.",
  },
  {
    title: "Stateful Baseline & Drift Detection",
    desc: "Mathematical delta computation compares baseline T0 snapshots against current T1 scans, surfacing new services and expired certs.",
  },
  {
    title: "Zero-Exploitation Safety Guarantee",
    desc: "Passive, read-only inspection. Flags dangling takeover candidates for authorized verification without attempting account claiming.",
  },
  {
    title: "Cryptographic SHA-256 Merkle Audit",
    desc: "Hashes inventory records into an immutable Merkle tree to prove audit timestamps and baseline evidence integrity to AIORI mentors.",
  },
];

export function ProblemSolution() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [activeMode, setActiveMode] = useState<"split" | "before" | "after">("split");
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.3"] });

  const beforeOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.35]);
  const afterOpacity = useTransform(scrollYProgress, [0.2, 0.8], [0.4, 1]);
  const lineW = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    <Section id="problem">
      <SectionHead
        tag="AIORI Hackathon PS-011 · Operational Alignment"
        title="From fragmented, unmanaged perimeter exposure to continuous provable visibility"
        lede="AIORI Problem Statement PS-011 addresses multi-cloud attack surface accumulation: unmaintained subdomains, expired TLS certificates, shadow ports, and dangling DNS CNAMEs. ArgusASM delivers an authorized, non-intrusive inventory and stateful drift sentinel strictly bounded by safety guardrails."
        action={
          <div className="flex items-center gap-2 border border-border bg-surface p-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveMode("split")}
              className={`px-3 py-1 transition-colors uppercase tracking-wider cursor-pointer ${
                activeMode === "split"
                  ? "bg-primary/20 border border-primary text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("before")}
              className={`px-3 py-1 transition-colors uppercase tracking-wider cursor-pointer ${
                activeMode === "before"
                  ? "bg-destructive/20 border border-destructive text-destructive font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Attack Surface Risks
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("after")}
              className={`px-3 py-1 transition-colors uppercase tracking-wider cursor-pointer ${
                activeMode === "after"
                  ? "bg-primary/20 border border-primary text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ArgusASM Sentinel
            </button>
          </div>
        }
      />

      <div ref={ref} className="mt-12 relative">
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border/60 -translate-x-1/2">
          <div
            className="w-full bg-primary transition-all duration-300"
            style={{ height: `${typeof lineW === "string" ? lineW : "50%"}` }}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Before Column */}
          {(activeMode === "split" || activeMode === "before") && (
            <div
              className={`space-y-4 transition-opacity duration-300 ${
                activeMode === "before" ? "lg:col-span-2 max-w-3xl mx-auto" : ""
              }`}
              style={{ opacity: activeMode === "split" ? (beforeOpacity as any) : 1 }}
            >
              <div className="flex items-center gap-2 border-b border-destructive/40 pb-2 font-mono text-xs uppercase tracking-wider text-destructive font-bold">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                Conventional Perimeter Blindspots
              </div>

              {BEFORE_POINTS.map((pt, i) => (
                <div
                  key={pt.title}
                  className="panel border-destructive/30 bg-destructive/5 p-4 transition-all hover:border-destructive/60"
                >
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-destructive">
                    <span>0{i + 1}.</span>
                    <span>{pt.title}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {pt.desc}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* After Column */}
          {(activeMode === "split" || activeMode === "after") && (
            <div
              className={`space-y-4 transition-opacity duration-300 ${
                activeMode === "after" ? "lg:col-span-2 max-w-3xl mx-auto" : ""
              }`}
              style={{ opacity: activeMode === "split" ? (afterOpacity as any) : 1 }}
            >
              <div className="flex items-center gap-2 border-b border-primary/40 pb-2 font-mono text-xs uppercase tracking-wider text-primary font-bold">
                <span className="h-2 w-2 rounded-full bg-primary" />
                ArgusASM Sentinel Architecture
              </div>

              {AFTER_POINTS.map((pt, i) => (
                <div
                  key={pt.title}
                  className="panel border-primary/30 bg-primary/5 p-4 transition-all hover:border-primary/60 shadow-[0_0_15px_rgba(20,184,166,0.06)]"
                >
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary">
                    <span>0{i + 1}.</span>
                    <span>{pt.title}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {pt.desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
