import { fmtPct } from "@/lib/format";

export default function StatCard({
  label,
  value,
  changePct,
  tone,
  accent = false,
}: {
  label: string;
  value: string;
  changePct?: number;
  tone?: "up" | "down";
  accent?: boolean;
}) {
  const valueClass = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-white";
  return (
    <div className="card relative overflow-hidden p-5">
      {accent && <div className="absolute inset-x-0 top-0 h-px bg-brand opacity-70" />}
      <div className="text-[13px] font-medium text-muted">{label}</div>
      <div className={`mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums ${valueClass}`}>
        {value}
      </div>
      {typeof changePct === "number" && (
        <div className={`mt-1 text-sm font-medium ${changePct >= 0 ? "text-up" : "text-down"}`}>
          {fmtPct(changePct)} <span className="text-muted-2">vs 24h</span>
        </div>
      )}
    </div>
  );
}
