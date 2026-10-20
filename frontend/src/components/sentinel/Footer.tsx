import { PROJECT, LIVE_TELEMETRY } from "@/data/sentinel";

const RESOURCES = [
  {
    label: "Proposed Structure Hackathon Whitepaper",
    meta: "PDF · PS-011 Architecture & Probe Formulation",
    href: "/docs/hackathon-format/Proposed-structure-hackathon.pdf",
  },
  {
    label: "Approved Scope Specification & Guardrails",
    meta: "JSON · 20 Domains / 10 Hosts Limit",
    href: "/approved_scope.json",
  },
  {
    label: "Seeded Faults & Automated Test Runner",
    meta: "Python · 100% Detection Rate Verification",
    href: "/tests/seeded_validation.py",
  },
  {
    label: "Cryptographic SHA-256 Merkle Audit Proof",
    meta: `Block #${LIVE_TELEMETRY.blockHeight} · Tamper-Free Verified`,
    href: "/audit#ledger",
  },
];

export function Footer() {
  return (
    <footer id="docs" className="border-t border-border bg-background px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: Project Overview */}
          <div>
            <div className="flex items-center gap-3 font-mono text-sm tracking-tight">
              <div className="flex h-7 w-7 items-center justify-center border border-border-strong bg-surface">
                <img src="/logo.png" alt="ArgusASM Logo" className="h-full w-full object-contain" />
              </div>
              <span className="font-bold text-foreground">
                ARGUS<span className="text-primary">ASM</span>
              </span>
              <span className="border border-border bg-surface px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
                {PROJECT.version}
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {PROJECT.tagline}
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Built for <strong className="text-foreground">{PROJECT.event}</strong> ·{" "}
              <strong className="text-primary">{PROJECT.ps}</strong> · {PROJECT.org} · Track:{" "}
              {PROJECT.theme}.
            </p>

            <div className="mt-6 font-mono text-xs text-muted-foreground space-y-1.5 border-l-2 border-primary pl-3">
              <div>COMPLIANCE: <span className="text-foreground font-semibold">{PROJECT.compliance}</span></div>
              <div>COMMIT HASH: <span className="text-primary font-bold select-all">{PROJECT.commit}</span></div>
              <div>SCOPE POLICY: <span className="text-primary font-semibold">Max 20 Domains / 10 Hosts (Capped)</span></div>
            </div>
          </div>

          {/* Right Column: Key Resources */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary font-bold mb-3">
              Technical Documentation & Deliverables
            </p>
            <ul className="grid gap-px border border-border bg-border">
              {RESOURCES.map((r) => (
                <li key={r.label}>
                  <a
                    href={r.href}
                    className="hover-glow flex items-center justify-between gap-4 bg-surface px-5 py-3.5 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{r.label}</span>
                    <span className="font-mono text-[10.5px] text-muted-foreground uppercase tracking-wider">
                      {r.meta}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>© 2026 {PROJECT.name} · AIORI Hackathon PS-011</span>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/aiori-hackathon/A3-PS011-TC116"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-glow flex items-center gap-1.5 border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              title="View on GitHub"
            >
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="text-[10px] normal-case font-semibold">aiori-hackathon/A3-PS011-TC116</span>
            </a>

            <span className="text-primary font-bold">
              Continuous Visibility · Zero Exploitation · Provable Drift
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
