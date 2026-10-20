import { useState } from "react";
import { PQC_COMPARISON } from "@/data/sentinel";
import { Section, SectionHead, StatusBadge } from "./shared";

export function PqcMatrix() {
  const [saLifetimeHours, setSaLifetimeHours] = useState(8);
  const [sensitivity, setSensitivity] = useState<"TOP_SECRET" | "CONFIDENTIAL" | "STANDARD">("TOP_SECRET");

  // Calculate HNDL Exposure Score (Harvest Now, Decrypt Later)
  const sensitivityMultiplier = sensitivity === "TOP_SECRET" ? 2.5 : sensitivity === "CONFIDENTIAL" ? 1.5 : 1.0;
  const hndlExposureYears = Math.round((saLifetimeHours / 2) * sensitivityMultiplier * 4);

  return (
    <Section id="pqc" className="dot-bg">
      <SectionHead
        tag="Cryptographic Certificate & Key Posture"
        title="Certificate Validity & Cryptographic Posture Matrix"
        lede="ArgusASM audits certificate trust anchors, key lengths, signature algorithms, and protocol versions across approved perimeter endpoints per RFC 5280 and CA/Browser Forum baseline requirements."
      />

      {/* PQC Comparison Table */}
      <div className="panel mt-10 overflow-x-auto border-border/80 bg-surface/90 shadow-2xl">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-border bg-background/80 text-[10.5px] uppercase tracking-wider text-muted-foreground">
              <th className="p-4">Group / Algorithm</th>
              <th className="p-4">Type</th>
              <th className="p-4">Key Size</th>
              <th className="p-4">Classical Security</th>
              <th className="p-4">Quantum Safe</th>
              <th className="p-4">Posture Status</th>
              <th className="p-4">Standard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {PQC_COMPARISON.map((row) => (
              <tr key={row.group} className="hover:bg-surface-raised transition-colors">
                <td className="p-4 font-bold text-foreground">{row.group}</td>
                <td className="p-4 text-foreground/90">{row.type}</td>
                <td className="p-4 text-muted-foreground">{row.size}</td>
                <td className="p-4 text-foreground/90">{row.security}</td>
                <td className="p-4">
                  {row.quantumSafe ? (
                    <span className="inline-flex items-center gap-1 text-primary font-bold">
                      YES (PQ-SAFE)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-destructive font-bold">
                      NO (VULNERABLE)
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="p-4 text-muted-foreground">{row.standard}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interactive HNDL Risk Window Calculator */}
      <div className="mt-8 border border-border bg-surface p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-3 font-mono">
          <h3 className="text-base font-bold text-foreground">
            Interactive "Harvest Now, Decrypt Later" (HNDL) Threat Calculator
          </h3>
          <span className="text-xs text-primary">CNSA 2.0 Risk Model</span>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-muted-foreground mb-1.5">
                <span>TLS Key Rotation / Session Lifetime:</span>
                <span className="text-primary font-bold">{saLifetimeHours} Hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={saLifetimeHours}
                onChange={(e) => setSaLifetimeHours(Number(e.target.value))}
                className="w-full accent-primary bg-background"
              />
            </div>

            <div>
              <span className="text-muted-foreground block mb-2">Perimeter Asset Data Classification:</span>
              <div className="grid grid-cols-3 gap-2">
                {(["TOP_SECRET", "CONFIDENTIAL", "STANDARD"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSensitivity(lvl)}
                    className={`border p-2 uppercase tracking-wider text-[10px] ${
                      sensitivity === lvl
                        ? "border-primary bg-primary/15 text-primary font-bold"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lvl.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="border border-border/80 bg-background/80 p-5 font-mono text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estimated Retrospective Exposure:</span>
              <span className="text-xl font-bold text-destructive">
                ~{hndlExposureYears} Years
              </span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-muted-foreground font-sans pt-2">
              If an adversary intercepts and archives perimeter traffic today, they will decrypt historical sessions when cryptographically relevant quantum computers (CRQC) emerge.
            </p>
            <div className="pt-2 border-t border-border/60 text-primary text-[11px]">
              <strong>ArgusASM Recommendation:</strong> Enforce TLS 1.3 with hybrid post-quantum key exchange (ML-KEM-768) and rotate perimeter certificates regularly per RFC 5280.
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
