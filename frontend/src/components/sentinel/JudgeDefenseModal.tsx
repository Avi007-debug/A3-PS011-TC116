import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface QaItem {
  id: string;
  category: "Scope & Non-Exploitation" | "The 4 Documented Probes" | "Baseline Drift & Delta" | "Cryptographic Merkle Audit" | "False-Positive Calibration";
  question: string;
  answer: string;
  tag: string;
  rfc?: string;
}

const QA_DATABASE: QaItem[] = [
  // Category 1: Scope & Non-Exploitation
  {
    id: "qa-1",
    category: "Scope & Non-Exploitation",
    question: "How does ArgusASM strictly enforce the PS-011 scope guardrails (max 20 domains, 10 hosts)?",
    answer: "ArgusASM loads canonical targets from approved_scope.json and passes every inspection target through ScopeSafetyEnforcer. If the scope file specifies >20 domains or >10 hosts, or if any check targets an unregistered IP or domain, the engine halts with an immediate pre-flight safety rejection before any network packet is dispatched.",
    tag: "Scope Guardrail",
    rfc: "PS-011 Scope Cap Spec",
  },
  {
    id: "qa-2",
    category: "Scope & Non-Exploitation",
    question: "What is ArgusASM's safety guarantee regarding subdomain takeover and dangling DNS?",
    answer: "ArgusASM adheres to a strict non-exploitation policy. When an orphaned CNAME pointing to an unallocated cloud service (e.g. AWS S3 NoSuchBucket) is discovered, it is recorded as a 'Potential Dangling DNS / Takeover Risk Candidate' requiring verification. ArgusASM never attempts to claim third-party buckets, register GitHub repositories, or execute unauthorized account takeovers.",
    tag: "Non-Exploitation Policy",
    rfc: "Read-Only Probing Policy",
  },

  // Category 2: The 4 Documented Probes
  {
    id: "qa-3",
    category: "The 4 Documented Probes",
    question: "How does Check 1 (DNS Inventory) catalogue and profile public DNS records?",
    answer: "Using dnspython and authoritative zone resolvers, Check 1 resolves A, AAAA, CNAME, MX, TXT, and NS records compliant with RFC 1035 and RFC 2181. It catalogs record counts, TTL values, nameservers, and resolution timestamps, establishing the structural identity of every approved domain.",
    tag: "Check 1: DNS Inventory",
    rfc: "RFC 1035 / RFC 2181",
  },
  {
    id: "qa-4",
    category: "The 4 Documented Probes",
    question: "How does Check 2 (TLS Inspector) evaluate certificate validity and expiration per RFC 5280?",
    answer: "Check 2 establishes safe TLS handshakes on port 443 with strict 3.0s timeout guards. It extracts X.509 Subject, Issuer, notBefore, notAfter, and Subject Alternative Names (SANs). It flags expired certificates (e.g. legacy.aiori.lab) and near-term expirations (<14 days), computing CVSS deductions for broken browser trust anchors.",
    tag: "Check 2: TLS Inspection",
    rfc: "RFC 5280 §4.1.2.5",
  },
  {
    id: "qa-5",
    category: "The 4 Documented Probes",
    question: "Why does Check 3 limit port inspection strictly to permitted ports [22, 53, 80, 443, 8080]?",
    answer: "Unrestricted aggressive port scanning violates the PS-011 authorized assessment charter. ArgusASM whitelists exactly 5 permitted service ports: 22 (SSH), 53 (DNS), 80 (HTTP), 443 (HTTPS), and 8080 (Alt-HTTP/Proxy). It captures non-intrusive service banners (e.g. HTTP Server header) to verify expected workloads without running exploit payloads.",
    tag: "Check 3: Permitted Ports",
    rfc: "PS-011 Port Whitelist",
  },
  {
    id: "qa-6",
    category: "The 4 Documented Probes",
    question: "How does Check 4 detect potential dangling DNS across AWS S3, GitHub Pages, and Azure?",
    answer: "Check 4 identifies CNAME records pointing to cloud provider hostnames and performs non-intrusive HTTP GET requests to check for deprovisioned service fingerprints: NoSuchBucket for AWS S3, 404 There isn't a GitHub Pages site here, and 404 Web Site not found for Azure Web Apps. Targets matching these signatures are flagged with high confidence.",
    tag: "Check 4: Dangling CNAME",
    rfc: "Cloud Fingerprint Taxonomy",
  },

  // Category 3: Baseline Drift & Delta
  {
    id: "qa-7",
    category: "Baseline Drift & Delta",
    question: "How does the Stateful Drift Engine compute deltas between T0 Baseline and T1 Current?",
    answer: "ArgusASM persists immutable JSON snapshots of the attack surface. The StatefulDriftEngine performs a structured set-difference comparison: detecting newly opened shadow ports (NEW_SERVICE), expired TLS certificates (EXPIRED_CERT), newly orphaned CNAMEs (DANGLING_DNS), and DNS zone modifications, producing human-readable and machine-parseable diff events.",
    tag: "Stateful Drift Engine",
    rfc: "PS-011 Delta Spec",
  },
  {
    id: "qa-8",
    category: "Baseline Drift & Delta",
    question: "How does ArgusASM ensure that seeded issues are reliably detected?",
    answer: "ArgusASM includes an automated validation suite (seeded_validation.py) that targets 3 pre-configured seeded faults: legacy.aiori.lab (expired cert), dev-edge.aiori.lab:8080 (shadow port), and test-s3.aiori.lab (dangling S3 CNAME). The validation runner empirically tests and asserts 100% detection rate before evaluators.",
    tag: "Seeded Validation",
    rfc: "Empirical Fault Harness",
  },

  // Category 4: Cryptographic Merkle Audit
  {
    id: "qa-9",
    category: "Cryptographic Merkle Audit",
    question: "Why does ArgusASM anchor inventory snapshots into a SHA-256 Merkle tree?",
    answer: "A primary challenge in attack surface management is proving baseline integrity over time. ArgusASM computes SHA-256 hashes across approved scope, DNS records, TLS certificates, and port states, combining them into an immutable Merkle root. This mathematically guarantees that snapshot evidence and drift timestamps were not retroactively altered.",
    tag: "SHA-256 Merkle Provenance",
    rfc: "FIPS 180-4 / NIST SP 800-53",
  },

  // Category 5: False-Positive Calibration
  {
    id: "qa-10",
    category: "False-Positive Calibration",
    question: "How does ArgusASM handle false positives such as wildcard DNS zones and CDN proxies?",
    answer: "ArgusASM tests for wildcard DNS by querying random UUID subdomains; if they resolve, dangling findings under that zone are downgraded to prevent false alarms. For CDN edge proxies (Cloudflare/CloudFront), edge response headers and ASNs are identified to prevent misattributing CDN edge certificates or 404 pages to the origin server.",
    tag: "Wildcard & CDN Calibration",
    rfc: "FP Mitigation Engine",
  },
];

export function JudgeDefenseModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("qa-1");
  const modalRef = useRef<HTMLDivElement | null>(null);

  const categories = ["ALL", ...Array.from(new Set(QA_DATABASE.map((item) => item.category)))];

  const filteredItems = QA_DATABASE.filter((item) => {
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.rfc && item.rfc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-background/80 backdrop-blur-md">
      <div
        ref={modalRef}
        className="panel relative flex flex-col w-full max-w-4xl max-h-[85vh] bg-surface border-border shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-background/90 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h2 className="font-mono text-base font-bold text-foreground uppercase tracking-wider">
                ArgusASM Methodology & Compliance Dossier
              </h2>
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">
              AIORI Hackathon 2026 · Problem Statement PS-011 Evaluation Defense
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="border-b border-border/80 bg-background/50 p-4 space-y-3 font-mono text-xs">
          <input
            type="text"
            placeholder="Search methodology, RFCs, probes, or guardrails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "border border-primary bg-primary/20 text-primary font-bold"
                    : "border border-border/60 bg-surface/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No methodology items matching search query.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`border transition-all ${
                    isExpanded
                      ? "border-primary/60 bg-surface shadow-[0_0_12px_rgba(20,184,166,0.12)]"
                      : "border-border/70 bg-background/40 hover:border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="flex w-full items-start justify-between p-3.5 text-left cursor-pointer gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 border border-primary/40 bg-primary/10 text-primary font-semibold">
                          {item.tag}
                        </span>
                        {item.rfc && (
                          <span className="text-[10px] text-muted-foreground">
                            [{item.rfc}]
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-foreground">
                        {item.question}
                      </h3>
                    </div>
                    <span className="text-primary text-sm font-bold">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border/60 bg-background/50 p-4 font-sans text-xs text-muted-foreground leading-relaxed">
                      <p className="text-foreground/90">{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-background/90 px-6 py-3 font-mono text-[11px] text-muted-foreground">
          <span>Standards: RFC 1035 · RFC 5280 · Non-Exploitation Policy</span>
          <button
            type="button"
            onClick={onClose}
            className="text-primary hover:underline font-bold"
          >
            Close [ESC]
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
