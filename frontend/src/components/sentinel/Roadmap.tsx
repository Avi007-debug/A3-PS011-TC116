import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ROADMAP } from "@/data/sentinel";
import { Section, SectionHead, StatusBadge } from "./shared";

export function Roadmap() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [openPhase, setOpenPhase] = useState<string | null>("P7");
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.4"] });
  const fill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <Section id="roadmap" className="dot-bg">
      <SectionHead
        tag="Execution Roadmap"
        title="Eight engineering phases from testbed bring-up to adversarial validation"
        lede="Structured so that a demonstrable, verifiable software artifact is produced at every single milestone."
      />

      <div ref={ref} className="mt-12">
        {/* Animated fill progress bar */}
        <div className="relative hidden h-1 w-full bg-border md:block overflow-hidden">
          <motion.div className="absolute inset-y-0 left-0 bg-primary" style={{ width: fill }} />
        </div>

        <div className="grid gap-px border border-border bg-border md:mt-6 md:grid-cols-4">
          {ROADMAP.map((r) => {
            const isOpen = openPhase === r.p;

            return (
              <button
                key={r.p}
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenPhase(isOpen ? null : r.p)}
                className={`hover-glow bg-surface p-5 text-left transition-all ${
                  isOpen ? "bg-surface-raised border-b-2 border-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{r.p}</span>
                    <span className="text-muted-foreground text-[10px]">({r.timeline})</span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <h3 className="mt-3 text-sm font-bold text-foreground leading-snug">
                  {r.name}
                </h3>

                <div
                  className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground font-sans">
                      {r.obj}
                    </p>
                    <div className="mt-3 border-t border-border/60 pt-2 font-mono text-[10.5px]">
                      <span className="text-primary font-semibold block">Key Deliverable:</span>
                      <span className="text-foreground/90">{r.del}</span>
                      <span className="text-muted-foreground block text-[9.5px] mt-1">
                        ↳ Metric: {r.metrics}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
