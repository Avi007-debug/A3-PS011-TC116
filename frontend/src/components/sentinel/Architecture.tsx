import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { PIPELINE } from "@/data/sentinel";
import { Section, SectionHead } from "./shared";

export function Architecture() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const [selectedStage, setSelectedStage] = useState<number>(2); // Default to AI Engine (Stage 3, index 2)

  const active = PIPELINE[selectedStage] ?? PIPELINE[0]!;

  return (
    <Section id="pipeline">
      <SectionHead
        tag="System Architecture"
        title="Five-stage attack surface pipeline from scope guardrails to Merkle audit"
        lede="Pre-flight safety validation strictly enforces the 20-domain / 10-host cap, the multi-probe orchestrator executes 4 documented checks concurrently, and downstream drift artifacts carry cryptographic SHA-256 Merkle proofs."
      />

      <div ref={ref} className="mt-12">
        {/* SVG Circuit Visualizer */}
        <div className="relative overflow-x-auto py-4">
          <svg
            viewBox="0 0 1000 130"
            className="min-w-[700px] w-full"
            role="img"
            aria-label="Five-stage ArgusASM dataflow pipeline: Scope Guardrails, Multi-Probe Orchestrator, Stateful Drift Engine, Perimeter Hygiene Scorer, Merkle Ledger"
          >
            {/* Background Circuit Bus */}
            <line
              x1="80"
              y1="65"
              x2="920"
              y2="65"
              stroke="var(--border)"
              strokeWidth="3"
            />

            {/* Glowing Flowing Current */}
            <motion.line
              x1="80"
              y1="65"
              x2="920"
              y2="65"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeDasharray="840"
              initial={{ strokeDashoffset: 840 }}
              animate={inView ? { strokeDashoffset: 0 } : {}}
              transition={{ duration: 2.4, ease: "easeInOut" }}
            />

            {/* Stage Nodes */}
            {PIPELINE.map((s, i) => {
              const x = 80 + (840 / (PIPELINE.length - 1)) * i;
              const isSelected = selectedStage === i;

              return (
                <g
                  key={s.n}
                  onClick={() => setSelectedStage(i)}
                  className="cursor-pointer group"
                >
                  {/* Outer Pulsing Glow on Selected */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={65}
                      r={30}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="1.5"
                      className="animate-ping opacity-25"
                    />
                  )}

                  {/* Node Outer Circle */}
                  <motion.circle
                    cx={x}
                    cy={65}
                    r={22}
                    fill={isSelected ? "var(--surface-raised)" : "var(--background)"}
                    stroke={isSelected ? "var(--primary)" : "var(--border-strong)"}
                    strokeWidth={isSelected ? "2.5" : "1.5"}
                    animate={inView ? { stroke: isSelected ? "var(--primary)" : "var(--primary)" } : {}}
                    transition={{ delay: 0.3 + i * 0.35, duration: 0.3 }}
                  />

                  {/* Center Dot */}
                  <motion.circle
                    cx={x}
                    cy={65}
                    r={7}
                    fill={isSelected ? "var(--primary)" : "var(--primary)"}
                    initial={{ opacity: 0.2 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.3 + i * 0.35, duration: 0.3 }}
                  />

                  {/* Stage Number (Top) */}
                  <text
                    x={x}
                    y={26}
                    textAnchor="middle"
                    fill={isSelected ? "var(--primary)" : "var(--muted-foreground)"}
                    fontFamily="var(--font-code)"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    LAYER {s.n}
                  </text>

                  {/* Stage Name (Bottom) */}
                  <text
                    x={x}
                    y={112}
                    textAnchor="middle"
                    fill={isSelected ? "var(--foreground)" : "var(--muted-foreground)"}
                    fontFamily="var(--font-code)"
                    fontSize="12"
                    fontWeight={isSelected ? "bold" : "normal"}
                  >
                    {s.name.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Interactive Layer Detail Inspector */}
        <div className="mt-8 border border-border bg-surface p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4 font-mono">
            <div className="flex items-center gap-3">
              <span className="border border-primary/50 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                LAYER {active.n}
              </span>
              <h3 className="text-lg font-bold text-foreground">{active.name}</h3>
              <span className="text-xs text-muted-foreground">({active.badge})</span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">PROCESSING LATENCY:</span>
              <span className="font-bold text-primary">{active.latency}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {active.desc}
              </p>
              <div className="mt-4 font-mono text-xs text-muted-foreground">
                <strong className="text-primary">Underlying Tech:</strong> {active.tech}
              </div>
            </div>

            <div className="border border-border/80 bg-background/80 p-4 font-mono text-xs">
              <p className="text-[10.5px] uppercase tracking-wider text-primary font-semibold">
                Emitted Data Schema & Pipeline Artifacts
              </p>
              <p className="mt-2 text-foreground/90">
                ↳ {active.dataOut}
              </p>
            </div>
          </div>
        </div>

        {/* 5-Stage Compact Grid for Quick Overview */}
        <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-5">
          {PIPELINE.map((s, i) => {
            const isSelected = selectedStage === i;
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => setSelectedStage(i)}
                className={`p-4 text-left transition-colors ${
                  isSelected ? "bg-surface-raised border-b-2 border-primary" : "bg-surface hover:bg-surface-raised"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-primary">{s.n}</span>
                  <span className="text-[10px] text-muted-foreground">{s.latency}</span>
                </div>
                <h4 className="mt-1 font-mono text-xs font-semibold text-foreground truncate">
                  {s.name}
                </h4>
              </button>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
