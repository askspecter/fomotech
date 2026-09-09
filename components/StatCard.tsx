import { fmtPct } from "@/lib/format";

export default function StatCard({
  label,
  value,
  changePct,
}: {
  label: string;
  value: string;
  changePct?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
      {typeof changePct === "number" && (
        <div className={`mt-1 text-sm font-medium ${changePct >= 0 ? "text-up" : "text-down"}`}>
          {fmtPct(changePct)} <span className="text-muted">vs 24h</span>
        </div>
      )}
    </div>
  );
}
