import type { ReactNode } from "react";

export function useReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SectionHead({
  tag,
  title,
  lede,
  action,
}: {
  tag: string;
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="mono-tag flex items-center gap-2">
          <span className="inline-block h-px w-6 bg-primary/70" />
          {tag}
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {lede ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {lede}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative border-t border-border/70 px-5 py-24 sm:px-8 lg:px-12 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

export function StatusBadge({
  status,
  className = "",
}: {
  status: "CRITICAL" | "HIGH_RISK" | "WEAK" | "MEDIUM_RISK" | "TRANSITIONAL" | "RECOMMENDED_CLASSICAL" | "QUANTUM_RESISTANT" | "ARGUS_HARDENED_BASELINE" | "HARDENED" | "COMPLETED" | "ACTIVE" | "UPCOMING" | string;
  className?: string;
}) {
  let color = "text-muted-foreground border-border bg-muted/20";

  switch (status) {
    case "CRITICAL":
    case "HIGH_RISK":
      color = "text-destructive border-destructive/40 bg-destructive/10";
      break;
    case "WEAK":
    case "MEDIUM_RISK":
      color = "text-warn border-warn/40 bg-warn/10";
      break;
    case "TRANSITIONAL":
      color = "text-amber-300 border-amber-500/40 bg-amber-500/10";
      break;
    case "QUANTUM_RESISTANT":
    case "ARGUS_HARDENED_BASELINE":
    case "HARDENED":
    case "COMPLETED":
      color = "text-primary border-primary/50 bg-primary/10 shadow-[0_0_12px_rgba(20,184,166,0.15)]";
      break;
    case "ACTIVE":
      color = "text-primary border-primary/60 bg-primary/15 font-bold";
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] border ${color} ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function MonospaceHash({
  hash,
  label,
}: {
  hash: string;
  label?: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
      {label ? <span className="text-primary font-semibold">{label}:</span> : null}
      <span className="text-foreground font-mono font-medium select-all">{hash}</span>
    </div>
  );
}
