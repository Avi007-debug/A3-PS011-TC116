import { STACK } from "@/data/sentinel";
import { Section, SectionHead } from "./shared";

export function TechStack() {
  return (
    <Section id="stack">
      <SectionHead
        tag="Engineering Implementation"
        title="Production technology stack, grouped by architectural layer"
        lede="Engineered for high-throughput packet processing in a hackathon timebox and rock-solid reliability in an enterprise Security Operations Center (SOC). Every component is containerized and benchmarked."
      />

      <div className="mt-10 divide-y divide-border border-y border-border">
        {STACK.map((layer) => (
          <div
            key={layer.layer}
            className="grid gap-4 py-6 sm:grid-cols-[240px_1fr] sm:gap-8 hover:bg-surface/40 transition-colors px-2"
          >
            <div>
              <dt className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {layer.layer}
              </dt>
              <dd className="mt-1 text-[11px] text-muted-foreground font-sans">
                {layer.rationale}
              </dd>
            </div>

            <dd className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {layer.items.map((item) => (
                <div
                  key={item.name}
                  className="border border-border/80 bg-surface/70 p-3 font-mono text-xs hover-glow"
                >
                  <span className="font-bold text-foreground block">{item.name}</span>
                  <span className="text-[10.5px] text-muted-foreground block mt-1 font-sans leading-tight">
                    {item.detail}
                  </span>
                </div>
              ))}
            </dd>
          </div>
        ))}
      </div>
    </Section>
  );
}
