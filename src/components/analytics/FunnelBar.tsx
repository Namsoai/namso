import { FunnelStep } from "@/hooks/useAnalytics";

interface FunnelBarProps {
  title: string;
  steps: FunnelStep[];
  color?: string; // tailwind bg color class e.g. "bg-primary"
}

export default function FunnelBar({ title, steps, color = "bg-primary" }: FunnelBarProps) {
  const maxCount = Math.max(...steps.map(s => s.count), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-5 text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h3>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const pct = Math.round((step.count / maxCount) * 100);
          return (
            <div key={step.event}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{step.name}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {step.rate !== null && (
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${
                        step.rate >= 70
                          ? "bg-emerald-500/10 text-emerald-500"
                          : step.rate >= 40
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {step.rate}% from prev
                    </span>
                  )}
                  <span className="tabular-nums font-bold text-foreground">{step.count.toLocaleString()}</span>
                </span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${color}`}
                  style={{ width: `${pct}%`, opacity: 1 - i * 0.08 }}
                />
              </div>
              {i < steps.length - 1 && step.count > 0 && (
                <div className="mt-1 ml-1 text-[10px] text-muted-foreground/60">
                  ↓ {steps[i + 1].count} continue
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
