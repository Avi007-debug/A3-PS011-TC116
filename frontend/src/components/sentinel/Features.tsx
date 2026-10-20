import { useState } from "react";
import { FEATURES } from "@/data/sentinel";
import { Section, SectionHead } from "./shared";

export function Features({
  onRunCli,
}: {
  onRunCli?: (cmd: string) => void;
}) {
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [activeFeatureId, setActiveFeatureId] = useState<string>("WOW-01");
  const [viewLayout, setViewLayout] = useState<"interactive" | "grid">("interactive");

  const filteredFeatures =
    selectedTier === "ALL"
      ? FEATURES
      : FEATURES.filter((f) => f.tier === selectedTier);

  const activeFeature =
    FEATURES.find((f) => f.id === activeFeatureId) ?? FEATURES[0]!;

  return (
    <Section id="features">
      <SectionHead
        tag="Differentiators & Technical Capabilities"
        title="Technical capabilities across guardrails, probes, drift & audit tiers"
        lede="From strict scope safety enforcers and the 4 documented probes (DNS, TLS, permitted ports, dangling CNAMEs) to stateful baseline drift monitoring, time-travel scrubbers, and immutable SHA-256 Merkle audit ledgers. Built specifically for AIORI Hackathon 2026 Problem Statement PS-011."
        action={
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* View Layout Switcher */}
            <div className="flex border border-border bg-surface p-1">
              <button
                type="button"
                onClick={() => setViewLayout("interactive")}
                className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                  viewLayout === "interactive"
                    ? "bg-primary/20 text-primary border border-primary/50 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Interactive Explorer
              </button>
              <button
                type="button"
                onClick={() => setViewLayout("grid")}
                className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                  viewLayout === "grid"
                    ? "bg-primary/20 text-primary border border-primary/50 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Cards Grid
              </button>
            </div>

            {/* Tier Filters */}
            <div className="flex border border-border bg-surface p-1">
              {["ALL", "TIER 1", "TIER 2", "TIER 3"].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedTier(tier)}
                  className={`px-3 py-1 uppercase tracking-wider transition-all ${
                    selectedTier === tier
                      ? "bg-primary/20 text-primary font-bold border border-primary/40"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tier === "ALL" ? "All (10)" : tier}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Modern Interactive Showcase Layout */}
      {viewLayout === "interactive" ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-[380px_1fr] lg:items-stretch">
          {/* Left Column: Interactive Capability Selection List */}
          <div className="flex max-h-[620px] flex-col gap-2 overflow-y-auto pr-1">
            {filteredFeatures.map((f) => {
              const isSelected = activeFeatureId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFeatureId(f.id)}
                  className={`hover-glow group flex flex-col p-4 text-left transition-all duration-200 border ${
                    isSelected
                      ? "border-primary bg-surface-raised shadow-[0_0_15px_rgba(20,184,166,0.18)]"
                      : "border-border/70 bg-surface/70 hover:border-primary/40 hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider">
                    <span
                      className={`font-bold px-2 py-0.5 border ${
                        isSelected
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border text-muted-foreground group-hover:text-primary"
                      }`}
                    >
                      {f.id}
                    </span>
                    <span className="text-[10.5px] text-muted-foreground">{f.tier}</span>
                  </div>

                  <h4
                    className={`mt-2 text-sm font-semibold transition-colors ${
                      isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                    }`}
                  >
                    {f.title}
                  </h4>

                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground font-sans">
                    {f.blurb}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Deep-Dive Technical Spotlight Panel */}
          <div className="panel flex flex-col justify-between border-border/90 bg-surface/95 p-8 shadow-2xl">
            <div>
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4 font-mono">
                <div className="flex items-center gap-3">
                  <span className="border border-primary bg-primary/20 px-3 py-1 text-xs font-bold text-primary shadow-[0_0_10px_rgba(20,184,166,0.2)]">
                    {activeFeature.id}
                  </span>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground block">
                      {activeFeature.tier} · {activeFeature.category}
                    </span>
                    <h3 className="mt-0.5 text-xl sm:text-2xl font-bold text-foreground">
                      {activeFeature.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="border border-border bg-background px-2.5 py-1 text-xs font-mono text-muted-foreground">
                    RFC / Standard: <strong className="text-primary">{activeFeature.rfc}</strong>
                  </span>
                </div>
              </div>

              {/* Core Description */}
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="font-mono text-xs uppercase tracking-wider text-primary font-bold mb-1.5">
                    Executive Summary & Objective
                  </h4>
                  <p className="text-sm sm:text-base leading-relaxed text-foreground font-sans">
                    {activeFeature.blurb}
                  </p>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-primary font-bold mb-1.5">
                    Deep Technical Architecture & Implementation
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground font-sans">
                    {activeFeature.detail}
                  </p>
                </div>

                {/* Mathematical Formulation */}
                {activeFeature.math && (
                  <div className="border border-border/80 bg-background/80 p-4 font-mono text-xs">
                    <span className="text-muted-foreground block text-[10.5px] uppercase tracking-wider mb-1">
                      Mathematical Signal Formulation / Cryptographic Specification:
                    </span>
                    <code className="text-primary text-sm font-bold block overflow-x-auto py-1">
                      {activeFeature.math}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* Runnable Terminal Action Box */}
            {activeFeature.cliCmd && (
              <div className="mt-8 border-t border-border/80 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-background/90 p-3 font-mono text-xs">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <span className="text-primary font-bold">$</span>
                    <code className="text-primary font-bold">{activeFeature.cliCmd}</code>
                  </div>
                  {onRunCli && (
                    <button
                      type="button"
                      onClick={() => onRunCli(activeFeature.cliCmd)}
                      className="hover-glow border border-primary/70 bg-primary/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/30 cursor-pointer"
                    >
                      RUN IN CLI
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Grid Layout (10 Cards) */
        <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {filteredFeatures.map((f) => (
            <div
              key={f.id}
              className="hover-glow group flex flex-col justify-between bg-surface p-6 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-3 font-mono text-xs uppercase tracking-wider">
                  <span className="font-bold text-primary border border-primary/40 bg-primary/10 px-2 py-0.5">
                    {f.id}
                  </span>
                  <span className="text-muted-foreground text-[11px]">{f.tier}</span>
                </div>

                <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {f.category}
                </p>
                <h3 className="mt-1 text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                  {f.title}
                </h3>

                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground font-sans">
                  {f.blurb}
                </p>

                <div className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground font-sans leading-relaxed">
                  {f.detail}
                </div>
              </div>

              <div className="mt-5 border-t border-border/50 pt-3 flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground text-[11px]">
                  RFC: <strong className="text-primary">{f.rfc}</strong>
                </span>
                {f.cliCmd && onRunCli && (
                  <button
                    type="button"
                    onClick={() => onRunCli(f.cliCmd)}
                    className="border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10.5px] uppercase tracking-wider text-primary hover:bg-primary/20"
                  >
                    Run CLI
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
