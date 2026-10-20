import { TEAM } from "@/data/sentinel";
import { Section, SectionHead } from "./shared";

export function Team() {
  return (
    <Section id="team">
      <SectionHead
        tag="Engineering & Research Roster"
        title="Six specialized disciplines, one cohesive security architecture"
        lede="Responsibility is strictly delineated across protocol state machines, machine learning signal pipelines, eBPF kernel hooks, and cryptographic ledgers."
      />

      <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {TEAM.map((m) => (
          <div key={m.role} className="hover-glow bg-surface p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-primary font-bold">&gt; {m.role}</span>
                <span className="border border-border/70 bg-background/50 px-1.5 py-0.5 text-[9.5px] text-muted-foreground">
                  {m.badge}
                </span>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground font-sans">
                {m.scope}
              </p>
            </div>

            <div className="mt-6 border-t border-border/60 pt-3 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
              <span>PGP FINGERPRINT:</span>
              <span className="text-primary font-bold select-all">{m.pgp}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
