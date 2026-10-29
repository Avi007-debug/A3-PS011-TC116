import { useState, useEffect } from "react";
import { Section, SectionHead, StatusBadge } from "./shared";
import { fetchSnapshotGraph } from "../../lib/api";

interface TopologyNode {
  id: string;
  label: string;
  sublabel: string;
  type: "domain" | "cname" | "host" | "service" | "cert";
  status: "healthy" | "warning" | "critical";
  x: number;
  y: number;
  ip?: string;
  port?: number;
  deduction?: number;
  evidence: string;
  rfc: string;
  remediation?: string;
}

interface TopologyLink {
  source: string;
  target: string;
  label?: string;
  status: "healthy" | "warning" | "critical";
}

const NODES: TopologyNode[] = [
  {
    id: "apex",
    label: "aiori.lab",
    sublabel: "Apex Domain",
    type: "domain",
    status: "healthy",
    x: 480,
    y: 70,
    evidence: "Authoritative SOA serial 2026102001, NS ns-01.aiori.lab",
    rfc: "RFC 1035",
  },
  {
    id: "sub-api",
    label: "api.aiori.lab",
    sublabel: "API Gateway",
    type: "domain",
    status: "healthy",
    x: 260,
    y: 160,
    ip: "10.0.1.15",
    evidence: "A: 10.0.1.15 · HTTPS 443 active",
    rfc: "RFC 1035",
  },
  {
    id: "sub-legacy",
    label: "legacy.aiori.lab",
    sublabel: "Seed 1: Expired TLS",
    type: "domain",
    status: "critical",
    x: 480,
    y: 170,
    ip: "10.0.2.10",
    deduction: 35,
    evidence: "X.509 certificate expired on 2026-01-01 (-292 days)",
    rfc: "RFC 5280",
    remediation: "certbot renew --force-renewal --cert-name legacy.aiori.lab",
  },
  {
    id: "sub-dev",
    label: "dev-edge.aiori.lab",
    sublabel: "Seed 2: Shadow Port 8080",
    type: "domain",
    status: "warning",
    x: 700,
    y: 160,
    ip: "10.0.2.20",
    port: 8080,
    deduction: 25,
    evidence: "Unapproved Port 8080 exposed (Werkzeug 3.0.1 debug banner)",
    rfc: "Permitted Port Policy",
    remediation: "ufw deny 8080/tcp && iptables -A INPUT -p tcp --dport 8080 -j DROP",
  },
  {
    id: "sub-s3",
    label: "test-s3.aiori.lab",
    sublabel: "Seed 3: Dangling CNAME",
    type: "domain",
    status: "critical",
    x: 880,
    y: 160,
    deduction: 30,
    evidence: "CNAME -> aiori-dormant-bucket.s3.us-east-1.amazonaws.com (NoSuchBucket HTTP 404)",
    rfc: "Cloud Fingerprint",
    remediation: "aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch '...DELETE...'",
  },
  {
    id: "host-15",
    label: "10.0.1.15",
    sublabel: "Production Host",
    type: "host",
    status: "healthy",
    x: 200,
    y: 280,
    evidence: "PTR registered · Port 80, 443 permitted",
    rfc: "RFC 1035",
  },
  {
    id: "host-legacy",
    label: "10.0.2.10",
    sublabel: "Internal Legacy Host",
    type: "host",
    status: "critical",
    x: 420,
    y: 280,
    evidence: "TLS certificate invalid anchor",
    rfc: "RFC 5280",
  },
  {
    id: "host-dev",
    label: "10.0.2.20",
    sublabel: "Dev Edge Host",
    type: "host",
    status: "warning",
    x: 640,
    y: 280,
    evidence: "Listening on 0.0.0.0:8080 without reverse-proxy authentication",
    rfc: "Port Audit",
  },
  {
    id: "cloud-s3",
    label: "AWS S3 Cloud",
    sublabel: "aiori-dormant-bucket",
    type: "cname",
    status: "critical",
    x: 880,
    y: 280,
    evidence: "Amazon S3 NoSuchBucket: The specified bucket does not exist",
    rfc: "Subdomain Takeover",
  },
];

const LINKS: TopologyLink[] = [
  { source: "apex", target: "sub-api", status: "healthy" },
  { source: "apex", target: "sub-legacy", status: "critical" },
  { source: "apex", target: "sub-dev", status: "warning" },
  { source: "apex", target: "sub-s3", status: "critical" },
  { source: "sub-api", target: "host-15", status: "healthy" },
  { source: "sub-legacy", target: "host-legacy", status: "critical" },
  { source: "sub-dev", target: "host-dev", status: "warning" },
  { source: "sub-s3", target: "cloud-s3", status: "critical" },
];

export function AssetTopologyGraph() {
  const [nodes, setNodes] = useState<TopologyNode[]>(NODES);
  const [links, setLinks] = useState<TopologyLink[]>(LINKS);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("sub-legacy");
  const [filter, setFilter] = useState<"all" | "healthy" | "drifting">("all");
  const [activeSnapshot, setActiveSnapshot] = useState<string>("T1");

  useEffect(() => {
    let mounted = true;
    fetchSnapshotGraph(activeSnapshot).then((data) => {
      if (mounted && data && Array.isArray(data.nodes) && Array.isArray(data.links)) {
        setNodes(data.nodes);
        setLinks(data.links);
      }
    });
    return () => {
      mounted = false;
    };
  }, [activeSnapshot]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? nodes[0] ?? NODES[2]!;

  const filteredNodes = nodes.filter((n) => {
    if (filter === "healthy") return n.status === "healthy";
    if (filter === "drifting") return n.status !== "healthy";
    return true;
  });

  return (
    <Section id="topology" className="dot-bg">
      <SectionHead
        tag="Argus Watchfield · Tier 2 Differentiator"
        title="Interactive Asset Relationship Graph & Node-Link Topology"
        lede="Visual representation of external perimeter relationships: Apex Domains → Subdomains → Cloud CNAME Targets → Host IPs → Service Ports. Nodes pulse amber/red upon detecting stateful drift."
        action={
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground uppercase text-[10px]">Snapshot:</span>
              {(["T0", "T1", "T2"] as const).map((snap) => (
                <button
                  key={snap}
                  type="button"
                  onClick={() => setActiveSnapshot(snap)}
                  className={`border px-2.5 py-0.5 uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
                    activeSnapshot === snap
                      ? "border-primary bg-primary/20 text-primary font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {snap}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 border-l border-border pl-3">
              <span className="text-muted-foreground uppercase text-[10px]">Filter:</span>
              {(["all", "drifting", "healthy"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilter(mode)}
                  className={`border px-2.5 py-0.5 uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
                    filter === mode
                      ? "border-primary bg-primary/20 text-primary font-bold shadow-[0_0_10px_rgba(20,184,166,0.2)]"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "all" ? `All (${nodes.length})` : mode === "drifting" ? `Drifting (${nodes.filter(n => n.status !== "healthy").length})` : "Healthy"}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: SVG Watchfield Visualizer */}
        <div className="relative overflow-hidden rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0D15] p-4 shadow-xl backdrop-blur-md">
          {/* Subtle Grid Lines */}
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-10 dark:opacity-25" />

          {/* SVG Diagram Canvas */}
          <svg viewBox="0 0 1000 360" className="w-full h-auto">
            {/* Draw links */}
            {links.map((link, idx) => {
              const src = nodes.find((n) => n.id === link.source);
              const tgt = nodes.find((n) => n.id === link.target);
              if (!src || !tgt) return null;

              const isHighlighted =
                selectedNode.id === src.id || selectedNode.id === tgt.id;

              return (
                <g key={idx}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={
                      link.status === "critical"
                        ? "rgba(220, 38, 38, 0.75)"
                        : link.status === "warning"
                          ? "rgba(217, 119, 6, 0.75)"
                          : "rgba(2, 132, 199, 0.55)"
                    }
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    strokeDasharray={isHighlighted ? "none" : "4 4"}
                  />
                  {/* Subtle Signal Dot along line */}
                  <circle
                    cx={(src.x + tgt.x) / 2}
                    cy={(src.y + tgt.y) / 2}
                    r={2.5}
                    fill={
                      link.status === "critical"
                        ? "#DC2626"
                        : link.status === "warning"
                          ? "#D97706"
                          : "#0284C7"
                    }
                    className="animate-pulse"
                  />
                </g>
              );
            })}

            {/* Draw nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNode.id === node.id;
              const isCritical = node.status === "critical";
              const isWarning = node.status === "warning";

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer group"
                >
                  {/* Pulsing Outer Ping for drifting nodes */}
                  {(isCritical || isWarning) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={24}
                      fill="none"
                      stroke={isCritical ? "#DC2626" : "#D97706"}
                      strokeWidth={1}
                      className="animate-ping opacity-30"
                    />
                  )}

                  {/* Node Outer Ring */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 18 : 14}
                    className="fill-white dark:fill-[#0D121D] transition-all duration-200"
                    stroke={
                      isCritical
                        ? "#DC2626"
                        : isWarning
                          ? "#D97706"
                          : isSelected
                            ? "#0284C7"
                            : "rgba(100, 116, 139, 0.5)"
                    }
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />

                  {/* Node Core */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 7 : 5}
                    fill={
                      isCritical
                        ? "#DC2626"
                        : isWarning
                          ? "#D97706"
                          : "#0284C7"
                    }
                  />

                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y + 30}
                    textAnchor="middle"
                    className={`font-mono text-[11px] font-bold ${
                      isSelected
                        ? "fill-blue-600 dark:fill-orange-400 font-extrabold"
                        : isCritical
                          ? "fill-red-600 dark:fill-destructive"
                          : isWarning
                            ? "fill-amber-600 dark:fill-amber-400"
                            : "fill-slate-900 dark:fill-foreground"
                    }`}
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 43}
                    textAnchor="middle"
                    className="font-mono text-[9px] font-semibold fill-slate-600 dark:fill-muted-foreground uppercase"
                  >
                    {node.sublabel}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Canvas Footer Legend */}
          <div className="mt-2 flex flex-wrap items-center justify-between border-t border-slate-200 dark:border-white/10 pt-2 font-mono text-[10px] text-slate-600 dark:text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-primary" /> Healthy
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Port Warning
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-destructive" /> Critical Fault
              </span>
            </div>
            <span>Click any node to inspect evidence dossier</span>
          </div>
        </div>

        {/* Right: Selected Node Evidence Dossier Card */}
        <div className="flex flex-col justify-between rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E131F]/90 p-5 shadow-xl backdrop-blur-md font-mono text-slate-900 dark:text-foreground">
          <div>
            {/* Header / ID Badge */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                  Asset Identity
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-foreground mt-0.5">
                  {selectedNode.label}
                </h3>
              </div>
              <StatusBadge status={selectedNode.status.toUpperCase()} />
            </div>

            {/* Structured Metadata Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-background/60 p-2.5">
                <span className="text-[10px] text-slate-500 dark:text-muted-foreground block uppercase">Node Type</span>
                <span className="font-bold text-slate-900 dark:text-foreground uppercase">{selectedNode.type}</span>
              </div>
              <div className="border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-background/60 p-2.5">
                <span className="text-[10px] text-slate-500 dark:text-muted-foreground block uppercase">Standard</span>
                <span className="font-bold text-blue-700 dark:text-primary">{selectedNode.rfc}</span>
              </div>
              {selectedNode.ip && (
                <div className="border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-background/60 p-2.5">
                  <span className="text-[10px] text-slate-500 dark:text-muted-foreground block uppercase">Host IP</span>
                  <span className="font-bold text-slate-900 dark:text-foreground">{selectedNode.ip}</span>
                </div>
              )}
              {selectedNode.deduction && (
                <div className="border border-red-200 dark:border-destructive/20 bg-red-50 dark:bg-destructive/10 p-2.5">
                  <span className="text-[10px] text-red-700 dark:text-destructive block uppercase">Hygiene Impact</span>
                  <span className="font-bold text-red-700 dark:text-destructive">-{selectedNode.deduction} Pts</span>
                </div>
              )}
            </div>

            {/* Evidence Findings Block */}
            <div className="mt-4 border border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-background/80 p-3.5">
              <span className="text-[10.5px] uppercase text-blue-700 dark:text-primary font-bold block mb-1.5">
                [Audited Probe Evidence]
              </span>
              <p className="text-xs text-slate-900 dark:text-foreground/90 font-mono leading-relaxed">
                {selectedNode.evidence}
              </p>
            </div>

            {/* Advisory Remediation Command */}
            {selectedNode.remediation && (
              <div className="mt-4 border border-emerald-500/30 dark:border-teal-500/20 bg-emerald-50/70 dark:bg-teal-500/5 p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10.5px] uppercase text-emerald-800 dark:text-teal-400 font-bold">
                    Safe Remediation Fix
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-muted-foreground uppercase">Advisory Only</span>
                </div>
                <code className="text-[11px] font-mono text-emerald-950 dark:text-teal-200 bg-white dark:bg-black/50 border border-emerald-300 dark:border-emerald-500/20 p-2.5 block overflow-x-auto rounded select-all shadow-xs">
                  {selectedNode.remediation}
                </code>
              </div>
            )}
          </div>

          {/* Footer Timestamp & Merkle Leaf */}
          <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-3 text-[10.5px] text-slate-500 dark:text-muted-foreground flex items-center justify-between">
            <span>Verified Snapshot: {activeSnapshot} ({activeSnapshot === "T0" ? "Baseline" : activeSnapshot === "T1" ? "Current Drift" : "Remediated Recovery"})</span>
            <span className="text-blue-700 dark:text-primary font-bold">Integrity: Chained to Leaf #{selectedNode.id}</span>
          </div>
        </div>
      </div>
    </Section>
  );
}
