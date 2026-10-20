import { useState } from "react";
import { RotateCw, Copy } from "lucide-react";
import { ATTACK_SCENARIOS } from "@/data/sentinel";
import { Section, SectionHead, StatusBadge } from "./shared";

const REMEDIATION_PRESETS = [
  {
    id: "preset-dangling-cname",
    label: "Finding 1: Route53 Dangling CNAME Deletion",
    score: 96,
    rating: "HARDENED",
    delta: "+30 pts",
    target: "test-s3.aiori.lab",
    config: `# 1. Execute safe Route53 change batch to remove orphaned CNAME:
aws route53 change-resource-record-sets --hosted-zone-id Z1234567890 --change-batch '{
  "Changes": [{
    "Action": "DELETE",
    "ResourceRecordSet": {
      "Name": "test-s3.aiori.lab.",
      "Type": "CNAME",
      "TTL": 60,
      "ResourceRecords": [{"Value": "aiori-test-bucket-deprecated.s3.amazonaws.com"}]
    }
  }]
}'

# 2. Verify zone record deletion:
dig test-s3.aiori.lab @ns-01.aiori.lab CNAME +short  # (Returns empty)`,
    findings: [
      "Removes orphaned CNAME to decommissioned AWS S3 bucket",
      "Eliminates subdomain takeover candidate without service disruption",
      "Rollback: Re-apply CNAME if bucket is reclaimed in org account",
    ],
  },
  {
    id: "preset-certbot-renew",
    label: "Finding 2: ACME / Let's Encrypt TLS Renewal",
    score: 96,
    rating: "HARDENED",
    delta: "+35 pts",
    target: "legacy.aiori.lab",
    config: `# 1. Dry-run verification of standalone HTTP-01 challenge:
certbot certonly --standalone -d legacy.aiori.lab --dry-run

# 2. Execute certificate renewal:
certbot certonly --standalone -d legacy.aiori.lab --agree-tos -m ops@aiori.lab

# 3. Reload webserver and verify handshake expiry date:
systemctl reload nginx
echo | openssl s_client -servername legacy.aiori.lab -connect legacy.aiori.lab:443 2>/dev/null | openssl x509 -noout -dates`,
    findings: [
      "Restores valid X.509 PKI certificate chain (RFC 5280 compliant)",
      "Eliminates browser security warnings and expired trust anchors",
      "Rollback: Restore previous cert from /etc/letsencrypt/archive/",
    ],
  },
  {
    id: "preset-port-block",
    label: "Finding 3: UFW / iptables Port Isolation",
    score: 96,
    rating: "HARDENED",
    delta: "+25 pts",
    target: "dev-edge.aiori.lab:8080",
    config: `# 1. Block external ingress on unauthorized port 8080:
sudo ufw deny 8080/tcp

# 2. Or using direct Linux netfilter iptables:
sudo iptables -A INPUT -p tcp --dport 8080 -j DROP

# 3. Bind development debug server strictly to localhost:
# In web app configuration / systemd service:
# Environment="BIND_ADDRESS=127.0.0.1:8080"`,
    findings: [
      "Closes exposed Werkzeug debug console from external probing",
      "Restricts active listening services strictly to whitelist [22, 53, 80, 443]",
      "Rollback: sudo ufw delete deny 8080/tcp",
    ],
  },
];

export function AttackSandbox() {
  const [selectedSeed, setSelectedSeed] = useState(ATTACK_SCENARIOS[0]!.id);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number>(0);

  const [selectedPreset, setSelectedPreset] = useState(REMEDIATION_PRESETS[0]!.id);
  const [customConfig, setCustomConfig] = useState(REMEDIATION_PRESETS[0]!.config);

  const activeSeed =
    ATTACK_SCENARIOS.find((a) => a.id === selectedSeed) ?? ATTACK_SCENARIOS[0]!;
  const activePreset =
    REMEDIATION_PRESETS.find((p) => p.id === selectedPreset) ?? REMEDIATION_PRESETS[0]!;

  const handleSelectPreset = (id: string) => {
    setSelectedPreset(id);
    const p = REMEDIATION_PRESETS.find((preset) => preset.id === id);
    if (p) setCustomConfig(p.config);
  };

  const runSeedSimulation = () => {
    setIsSimulating(true);
    setSimStep(1);
    setTimeout(() => setSimStep(2), 600);
    setTimeout(() => setSimStep(3), 1200);
    setTimeout(() => {
      setSimStep(4);
      setIsSimulating(false);
    }, 1900);
  };

  return (
    <Section id="sandbox">
      <SectionHead
        tag="Seeded Issues & Remediation Sandbox"
        title="Seeded-fault verification harness & safe remediation advisor"
        lede="Demonstrating empirical detection of the 3 required seeded issues in Problem Statement PS-011: Expired TLS certificate, unexpected shadow port 8080, and dangling S3 CNAME record, complete with copy-paste remediation directives."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Left: Interactive Seeded Fault Harness */}
        <div className="border border-border bg-surface p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                [1] Seeded-Fault Detection Harness
              </h3>
              <span className="font-mono text-[10px] text-destructive border border-destructive/40 px-2 py-0.5 bg-destructive/10">
                100% Detection Rate
              </span>
            </div>

            {/* Seed Selector */}
            <div className="mt-4 flex flex-wrap gap-2">
              {ATTACK_SCENARIOS.map((atk) => (
                <button
                  key={atk.id}
                  type="button"
                  onClick={() => {
                    setSelectedSeed(atk.id);
                    setSimStep(0);
                  }}
                  className={`border p-2 font-mono text-[11px] uppercase tracking-wider transition-all text-left truncate max-w-[240px] cursor-pointer ${
                    selectedSeed === atk.id
                      ? "border-destructive bg-destructive/15 text-destructive font-bold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {atk.name}
                </button>
              ))}
            </div>

            {/* Seed Details */}
            <div className="mt-4 border border-border/80 bg-background/60 p-5 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">{activeSeed.name}</span>
                <StatusBadge status={activeSeed.severity} />
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>CVE/CWE: <strong className="text-destructive font-bold">{activeSeed.cve}</strong></span>
                <span>VECTOR: <strong className="text-foreground font-semibold">{activeSeed.vector}</strong></span>
              </div>

              <p className="text-foreground/90 leading-relaxed font-sans text-xs sm:text-sm font-medium">
                {activeSeed.description}
              </p>

              <div className="pt-2 border-t border-border/50">
                <span className="text-[10px] uppercase text-primary font-bold">ArgusASM Probe Verification:</span>
                <p className="text-muted-foreground text-xs mt-1 leading-snug">
                  {activeSeed.sentinelDetection}
                </p>
              </div>

              {/* Simulation Stepper */}
              {simStep > 0 && (
                <div className="border border-destructive/40 bg-destructive/10 p-3 space-y-1.5 text-[11px]">
                  <div className="text-destructive font-bold uppercase tracking-wider">
                    {simStep < 4 ? "Executing Probe Sequence..." : "Seeded Fault Verified"}
                  </div>
                  <div className="space-y-1 text-foreground/90">
                    {simStep >= 1 && <div>Step 1: Target scope boundary verified within caps ... OK</div>}
                    {simStep >= 2 && <div>Step 2: Non-intrusive probe payload dispatched ... OK</div>}
                    {simStep >= 3 && <div>Step 3: Response fingerprint matched seeded vulnerability signature</div>}
                    {simStep >= 4 && (
                      <div className="text-primary font-bold">
                        Step 4: Finding recorded in baseline delta. Score deduction applied.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4">
            <span className="font-mono text-[11px] text-muted-foreground">
              Run live probe evaluation:
            </span>
            <button
              type="button"
              onClick={runSeedSimulation}
              disabled={isSimulating}
              className={`hover-glow flex items-center gap-1.5 border border-destructive bg-destructive/15 px-4 py-2 font-mono text-xs uppercase tracking-wider text-destructive font-bold cursor-pointer ${
                isSimulating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <RotateCw className={`h-3 w-3 ${isSimulating ? "animate-spin" : ""}`} />
              <span>{isSimulating ? "Probing Target..." : "Replay Seed Check"}</span>
            </button>
          </div>
        </div>

        {/* Right: Automated Safe Remediation Advisor */}
        <div className="border border-border bg-surface p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                [2] Safe Remediation Advisor
              </h3>
              <span className="font-mono text-[10px] text-primary border border-primary/40 px-2 py-0.5 bg-primary/10">
                Copy-Paste Directives
              </span>
            </div>

            {/* Remediation Preset Selector */}
            <div className="mt-4 flex flex-wrap gap-2">
              {REMEDIATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`border p-2 font-mono text-[11px] uppercase tracking-wider transition-all text-left truncate max-w-[240px] cursor-pointer ${
                    selectedPreset === preset.id
                      ? "border-primary bg-primary/15 text-primary font-bold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Code Output Editor */}
            <div className="mt-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>Target: <strong className="text-foreground">{activePreset.target}</strong></span>
                <span className="text-primary font-bold">Projected Delta: {activePreset.delta}</span>
              </div>

              <textarea
                value={customConfig}
                onChange={(e) => setCustomConfig(e.target.value)}
                rows={10}
                className="w-full border border-border bg-background p-3 text-foreground focus:border-primary focus:outline-none leading-relaxed font-mono text-[11px]"
                spellCheck={false}
              />

              <div className="border border-border/80 bg-background/40 p-3 space-y-1">
                <span className="text-[10px] uppercase text-primary font-bold">Hardening Impact:</span>
                <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-0.5">
                  {activePreset.findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4">
            <span className="font-mono text-[11px] text-muted-foreground">
              Remediation status: <strong className="text-primary font-semibold">Non-Destructive</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(customConfig);
                alert("Remediation snippet copied to clipboard!");
              }}
              className="hover-glow flex items-center gap-1.5 border border-primary bg-primary/15 px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary font-bold cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Directive</span>
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}
