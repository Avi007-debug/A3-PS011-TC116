import { useState } from "react";
import { TRAFFIC_SCENARIOS } from "@/data/sentinel";
import { Section, SectionHead } from "./shared";

export function Classification() {
  const [selectedId, setSelectedId] = useState("dns_probe");
  const [isScanning, setIsScanning] = useState(false);

  const activeScenario =
    TRAFFIC_SCENARIOS.find((s) => s.id === selectedId) ?? TRAFFIC_SCENARIOS[0]!;

  const handleSelectScenario = (id: string) => {
    setSelectedId(id);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 700);
  };

  return (
    <Section id="classify" className="dot-bg">
      <SectionHead
        tag="Documented Probes · PS-011 Inspection Engine"
        title="Multi-Probe Asset Profiling & Fingerprint Attribution"
        lede="ArgusASM executes 4 documented checks concurrently across approved domains and hosts: DNS record inventory (RFC 1035), TLS certificate inspection (RFC 5280), permitted port auditing, and read-only dangling CNAME cloud detection."
      />

      {/* Scenario Selector Tabs */}
      <div className="mt-8 flex flex-wrap gap-2.5">
        {TRAFFIC_SCENARIOS.map((sc) => {
          const isSelected = sc.id === selectedId;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSelectScenario(sc.id)}
              className={`hover-glow border px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/20 text-primary font-bold shadow-[0_0_15px_rgba(20,184,166,0.25)]"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {sc.label}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Demo Container */}
      <div className="panel mt-6 overflow-hidden border-border/90 bg-surface/90 shadow-2xl">
        {/* Telemetry Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background/80 px-6 py-3.5 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="text-primary font-bold">PROBE: {activeScenario.protocol}</span>
            <span className="text-border">|</span>
            <span>ARTIFACT: <code className="text-foreground font-semibold">{activeScenario.pcapSample}</code></span>
          </div>

          <div className="flex items-center gap-4">
            <span>CADENCE: <strong className="text-foreground">{activeScenario.cadence}</strong></span>
            <span className="text-border">|</span>
            <span className="text-primary font-bold">ACCURACY: {activeScenario.conf}%</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 grid gap-8 lg:grid-cols-2">
          {/* Left: Probe Distribution & Histogram */}
          <div className="space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-muted-foreground uppercase tracking-wider">
              <span>Resolution Histogram / Timing Train</span>
              <span className="text-primary">{isScanning ? "Probing..." : "Steady State"}</span>
            </div>

            <div className="border border-border/80 bg-background/60 p-4 h-48 flex items-end gap-1">
              {activeScenario.distribution.map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-primary/70 hover:bg-primary transition-all rounded-t-sm"
                  style={{ height: `${isScanning ? Math.random() * 90 + 10 : val}%` }}
                  title={`Sample #${idx + 1}: Value ${val}`}
                />
              ))}
            </div>

            <p className="font-mono text-xs text-muted-foreground leading-relaxed">
              {activeScenario.hint}
            </p>
          </div>

          {/* Right: Key Feature Attributions */}
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider">
              <span>Fingerprint Attribution Weights</span>
              <span className="text-foreground font-semibold">4 Parameters</span>
            </div>

            <div className="space-y-2.5">
              {activeScenario.shapFeatures.map((feat) => (
                <div
                  key={feat.name}
                  className="border border-border/70 bg-background/40 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{feat.name}</span>
                    <span className="text-primary font-bold">{feat.value}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-muted-foreground">
                    <span>Impact: <strong className="text-primary uppercase">{feat.impact}</strong></span>
                    <span>Confidence Contribution</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
              <span>Status: <strong className="text-primary">PASSIVE READ-ONLY AUDIT</strong> · Complies with PS-011 Non-Exploitation Policy</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
