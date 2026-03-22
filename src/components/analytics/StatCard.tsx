import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  sublabel?: string;
  highlight?: boolean;
}

export default function StatCard({ label, value, icon: Icon, sublabel, highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-2 transition-shadow hover:shadow-md ${
        highlight
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </div>
      <div className={`font-display text-3xl font-bold ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
      {sublabel && (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}
