import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const SAMPLE_COMMANDS = [
  {
    cmd: "argus scan --scope approved_scope.json",
    output: `[+] Loading approved_scope.json (PS-011 Guardrails Enforced)
[+] Scope Validation: 15 domains / 8 hosts within caps (<=20 domains, <=10 hosts)
[+] Running Check 1 (DNS Inventory) ... 15 domains resolved (RFC 1035)
[+] Running Check 2 (TLS Inspector) ... 15 certificates inspected (RFC 5280)
    [!] CRITICAL: legacy.aiori.lab certificate expired on 2026-01-01
[+] Running Check 3 (Permitted Ports) ... Auditing ports [22, 53, 80, 443, 8080]
    [!] HIGH: dev-edge.aiori.lab:8080 open (Werkzeug debug console exposed)
[+] Running Check 4 (Dangling DNS) ... Cloud provider fingerprints evaluated
    [!] HIGH: test-s3.aiori.lab -> Orphaned CNAME to S3 (HTTP 404 NoSuchBucket)
[*] Perimeter Hygiene Score: 68/100 (ELEVATED RISK)`,
  },
  {
    cmd: "argus diff --baseline snapshots/T0.json --current snapshots/T1.json",
    output: `[+] Comparing Baseline Snapshot T0 with Current Snapshot T1:
    - [CRITICAL DRIFT] EXPIRED_CERT: legacy.aiori.lab (-292 days overdue)
    - [HIGH DRIFT] NEW_SERVICE: dev-edge.aiori.lab:8080 (Werkzeug debugger)
    - [HIGH DRIFT] DANGLING_DNS: test-s3.aiori.lab (Orphaned S3 bucket)
[*] Total Drift Events: 3
[*] Score Delta: 96 -> 68 (-28 Pts)
[*] Cryptographic Merkle Root: 0x7c4f9a3e2b1d8e5f6a0c4b2e8d1a3f5c...`,
  },
  {
    cmd: "argus verify --snapshot snapshots/T1.json",
    output: `[+] Querying SHA-256 Merkle Audit Chain:
    - Block Height: #1840291
    - Scope Manifest Leaf:   0x7f82b9a4c1e3... [VERIFIED]
    - DNS Inventory Leaf:    0x1a2b3c4d5e6f... [VERIFIED]
    - TLS Evidence Leaf:     0x9e8d7c6b5a4f... [VERIFIED]
    - Port Profiles Leaf:    0x3f5c7e9b0d2a... [VERIFIED]
    - Dangling Findings Leaf:0x8a9b0c1d2e3f... [VERIFIED]
[+] Computed Root: 0x7c4f9a3e2b1d8e5f6a0c4b2e8d1a3f5c7e9b0d2a4f6c8e1a3b5d7f9c1e3a5b7d
[*] Status: VERIFIED_TAMPER_FREE (Evidence unchanged since scan timestamp)`,
  },
  {
    cmd: "argus remediate --finding DRIFT-002 --format bash",
    output: `[+] Generating safe remediation snippet for dev-edge.aiori.lab:8080:
# Block external ingress on port 8080 via host firewall:
sudo ufw deny 8080/tcp
# Or using direct iptables rule:
sudo iptables -A INPUT -p tcp --dport 8080 -j DROP
# Verification command:
nc -zv dev-edge.aiori.lab 8080 (Should time out / refuse)
[*] Rollback command: sudo ufw delete deny 8080/tcp`,
  },
  {
    cmd: "argus stop",
    output: `[!] EMERGENCY KILL-SWITCH TRIGGERED:
[+] Terminating all in-flight asynchronous socket probes immediately.
[+] Preserving current state in snapshots/interrupted.json.
[*] Engine safe state restored. Zero packets in flight.`,
  },
];

export function CliTerminalModal({
  isOpen,
  onClose,
  initialCmd,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialCmd?: string | undefined;
}) {
  const [activeOutput, setActiveOutput] = useState<string>(
    SAMPLE_COMMANDS[0]?.output ?? ""
  );
  const [currentInput, setCurrentInput] = useState<string>(
    initialCmd || (SAMPLE_COMMANDS[0]?.cmd ?? "")
  );
  const [commandHistory, setCommandHistory] = useState<
    Array<{ cmd: string; out: string }>
  >([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const historyBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (initialCmd) {
        handleExecute(initialCmd);
      }
    }
  }, [isOpen, initialCmd]);

  useEffect(() => {
    historyBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commandHistory, activeOutput]);

  const handleExecute = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    const matched = SAMPLE_COMMANDS.find(
      (c) => c.cmd.toLowerCase() === trimmed.toLowerCase()
    );

    let output = "";
    if (matched) {
      output = matched.output;
    } else if (trimmed === "help" || trimmed === "argus --help") {
      output = `ArgusASM CLI - Attack-Surface Inventory & Drift Sentinel (PS-011)
Available Commands:
  argus scan --scope <file>      Run authorised probe across approved scope
  argus diff --baseline <T0>     Statefully compare baseline with later snapshot
  argus verify --snapshot <T1>   Verify cryptographic Merkle audit integrity
  argus remediate --finding <ID> Output non-destructive fix directives
  argus stop                     Emergency kill-switch to halt active probes`;
    } else {
      output = `[!] Command '${trimmed}' queued. Simulating execution:
[+] Validating target against approved_scope.json guardrails ... OK
[+] Executing authorized check ... Complete.
[*] Run 'argus --help' for documented command flags.`;
    }

    setCommandHistory((prev) => [...prev, { cmd: trimmed, out: output }]);
    setActiveOutput(output);
    setCurrentInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleExecute(currentInput);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-background/80 backdrop-blur-md">
      <div className="panel relative flex flex-col w-full max-w-3xl h-[600px] bg-surface border-border shadow-2xl overflow-hidden font-mono">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-destructive/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-primary/80" />
            </div>
            <span className="text-muted-foreground ml-2">argus-sentinel-cli (v1.0.0-prod)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close terminal"
            className="text-muted-foreground hover:text-foreground text-sm cursor-pointer p-0.5 rounded hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Command Pills */}
        <div className="flex flex-wrap gap-1.5 p-2 border-b border-border/70 bg-background/40 text-[10.5px]">
          <span className="text-muted-foreground py-0.5">Presets:</span>
          {SAMPLE_COMMANDS.map((sc) => (
            <button
              key={sc.cmd}
              type="button"
              onClick={() => handleExecute(sc.cmd)}
              className="px-2 py-0.5 border border-border/70 bg-surface/80 text-primary hover:border-primary cursor-pointer truncate max-w-[200px]"
            >
              {sc.cmd.split(" ")[1]} {sc.cmd.split(" ")[2] || ""}
            </button>
          ))}
        </div>

        {/* Terminal Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed bg-background/95">
          <div className="text-muted-foreground">
            ArgusASM Operator Sandbox [AIORI Hackathon 2026 PS-011]
            <br />
            Scope: 20 Domains / 10 Hosts · Non-Exploitation Policy Active. Type &apos;help&apos; for commands.
          </div>

          {commandHistory.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span>argus@sentinel:~$</span>
                <span className="text-foreground">{item.cmd}</span>
              </div>
              <pre className="text-muted-foreground whitespace-pre-wrap pl-4 border-l border-primary/30">
                {item.out}
              </pre>
            </div>
          ))}

          <div ref={historyBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 border-t border-border bg-background px-4 py-2 text-xs">
          <span className="text-primary font-bold">argus@sentinel:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type 'argus scan', 'argus diff', or 'help'..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleExecute(currentInput)}
            className="text-[11px] uppercase tracking-wider text-primary font-bold hover:underline cursor-pointer"
          >
            Run ↵
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
