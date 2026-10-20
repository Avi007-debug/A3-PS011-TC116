import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/sentinel/Nav";
import { Footer } from "@/components/sentinel/Footer";
import { CliTerminalModal } from "@/components/sentinel/CliTerminalModal";
import { JudgeDefenseModal } from "@/components/sentinel/JudgeDefenseModal";
import { SupabaseSettingsModal } from "@/components/sentinel/SupabaseSettingsModal";

export const Route = createFileRoute("/qa")({
  head: () => ({
    meta: [
      { title: "Methodology Dossier & Specification Q&A | ArgusASM" },
      {
        name: "description",
        content:
          "Authoritative answers to scope safety guardrails, the 4 documented probes (DNS, TLS, Permitted Ports, Dangling DNS), stateful baseline drift, and SHA-256 Merkle audit.",
      },
    ],
  }),
  component: QaPage,
});

const QA_ITEMS = [
  {
    cat: "Scope & Non-Exploitation",
    q: "How does ArgusASM strictly enforce the PS-011 scope guardrails (max 20 domains, 10 hosts)?",
    a: "ArgusASM loads canonical targets from approved_scope.json and passes every inspection target through ScopeSafetyEnforcer. If the scope file specifies >20 domains or >10 hosts, or if any check targets an unregistered IP or domain, the engine halts with an immediate pre-flight safety rejection before any network packet is dispatched.",
    tag: "Scope Guardrail",
  },
  {
    cat: "Scope & Non-Exploitation",
    q: "What is ArgusASM's safety guarantee regarding subdomain takeover and dangling DNS?",
    a: "ArgusASM adheres to a strict non-exploitation policy. When an orphaned CNAME pointing to an unallocated cloud service (e.g. AWS S3 NoSuchBucket) is discovered, it is recorded as a 'Potential Dangling DNS / Takeover Risk Candidate' requiring verification. ArgusASM never attempts to claim third-party buckets, register GitHub repositories, or execute unauthorized account takeovers.",
    tag: "Non-Exploitation Policy",
  },
  {
    cat: "The 4 Documented Probes",
    q: "How does Check 1 (DNS Inventory) catalogue and profile public DNS records?",
    a: "Using dnspython and authoritative zone resolvers, Check 1 resolves A, AAAA, CNAME, MX, TXT, and NS records compliant with RFC 1035 and RFC 2181. It catalogs record counts, TTL values, nameservers, and resolution timestamps, establishing the structural identity of every approved domain.",
    tag: "Check 1: DNS",
  },
  {
    cat: "The 4 Documented Probes",
    q: "How does Check 2 (TLS Inspector) evaluate certificate validity and expiration per RFC 5280?",
    a: "Check 2 establishes safe TLS handshakes on port 443 with strict 3.0s timeout guards. It extracts X.509 Subject, Issuer, notBefore, notAfter, and Subject Alternative Names (SANs). It flags expired certificates (e.g. legacy.aiori.lab) and near-term expirations (<14 days), computing CVSS deductions for broken browser trust anchors.",
    tag: "Check 2: TLS",
  },
  {
    cat: "The 4 Documented Probes",
    q: "Why does Check 3 limit port inspection strictly to permitted ports [22, 53, 80, 443, 8080]?",
    a: "Unrestricted aggressive port scanning violates the PS-011 authorized assessment charter. ArgusASM whitelists exactly 5 permitted service ports: 22 (SSH), 53 (DNS), 80 (HTTP), 443 (HTTPS), and 8080 (Alt-HTTP/Proxy). It captures non-intrusive service banners (e.g. HTTP Server header) to verify expected workloads without running exploit payloads.",
    tag: "Check 3: Ports",
  },
  {
    cat: "The 4 Documented Probes",
    q: "How does Check 4 detect potential dangling DNS across AWS S3, GitHub Pages, and Azure?",
    a: "Check 4 identifies CNAME records pointing to cloud provider hostnames and performs non-intrusive HTTP GET requests to check for deprovisioned service fingerprints: NoSuchBucket for AWS S3, 404 There isn't a GitHub Pages site here, and 404 Web Site not found for Azure Web Apps. Targets matching these signatures are flagged with high confidence.",
    tag: "Check 4: Dangling CNAME",
  },
  {
    cat: "Baseline Drift & Delta",
    q: "How does the Stateful Drift Engine compute deltas between T0 Baseline and T1 Current?",
    a: "ArgusASM persists immutable JSON snapshots of the attack surface. The StatefulDriftEngine performs a structured set-difference comparison: detecting newly opened shadow ports (NEW_SERVICE), expired TLS certificates (EXPIRED_CERT), newly orphaned CNAMEs (DANGLING_DNS), and DNS zone modifications, producing human-readable and machine-parseable diff events.",
    tag: "Stateful Drift",
  },
  {
    cat: "Cryptographic Merkle Audit",
    q: "Why does ArgusASM anchor inventory snapshots into a SHA-256 Merkle tree?",
    a: "A primary challenge in attack surface management is proving baseline integrity over time. ArgusASM computes SHA-256 hashes across approved scope, DNS records, TLS certificates, and port states, combining them into an immutable Merkle root. This mathematically guarantees that snapshot evidence and drift timestamps were not retroactively altered.",
    tag: "Merkle Provenance",
  },
  {
    cat: "False-Positive Calibration",
    q: "How does ArgusASM handle false positives such as wildcard DNS zones and CDN proxies?",
    a: "ArgusASM tests for wildcard DNS by querying random UUID subdomains; if they resolve, dangling findings under that zone are downgraded to prevent false alarms. For CDN edge proxies (Cloudflare/CloudFront), edge response headers and ASNs are identified to prevent misattributing CDN edge certificates or 404 pages to the origin server.",
    tag: "FP Mitigation",
  },
];

function QaPage() {
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const [isCliOpen, setIsCliOpen] = useState(false);
  const [isQaOpen, setIsQaOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [activeCliCmd, setActiveCliCmd] = useState<string | undefined>(undefined);

  const categories = ["ALL", ...Array.from(new Set(QA_ITEMS.map((item) => item.cat)))];

  const filtered = QA_ITEMS.filter((item) => {
    const matchCat = selectedCat === "ALL" || item.cat === selectedCat;
    const matchQuery =
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase()) ||
      item.tag.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQuery;
  });

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
        {/* Header */}
        <div className="border-b border-border/80 bg-surface/50 px-5 py-12 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
              <span>ArgusASM Sentinel</span>
              <span>/</span>
              <span className="text-primary font-bold">Methodology & Compliance Dossier</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Methodology Dossier & Specification Q&A
            </h1>

            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              Authoritative technical rationale, RFC citations, scope guardrails, and evaluators defense answers aligned with AIORI Hackathon 2026 Problem Statement PS-011.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
              <input
                type="text"
                placeholder="Search methodology, RFCs, probes, or guardrails..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border border-border bg-background px-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsQaOpen(true)}
                className="hover-glow border border-primary bg-primary/20 px-5 py-2.5 font-mono text-xs font-bold text-primary uppercase tracking-wider cursor-pointer"
              >
                Open Full Modal Dossier
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:px-12">
          <div className="flex flex-wrap gap-2 mb-8 font-mono text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-3.5 py-1.5 uppercase tracking-wider transition-colors cursor-pointer border ${
                  selectedCat === cat
                    ? "border-primary bg-primary/20 text-primary font-bold"
                    : "border-border/70 bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3 font-mono">
            {filtered.map((item, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className={`border transition-all ${
                    isExpanded
                      ? "border-primary/60 bg-surface shadow-[0_0_15px_rgba(20,184,166,0.12)]"
                      : "border-border/80 bg-background/50 hover:border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="flex w-full items-start justify-between p-4 text-left cursor-pointer gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 border border-primary/40 bg-primary/10 text-primary font-semibold uppercase">
                          {item.tag}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {item.cat}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground mt-1">
                        {item.q}
                      </h3>
                    </div>
                    <span className="text-primary font-bold text-base shrink-0">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border/60 bg-background/60 p-5 font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      <p className="text-foreground/90">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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
