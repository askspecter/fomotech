import { isLive } from "@/lib/fomo-api";

export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/80 px-5 py-4 backdrop-blur">
      <div>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
            isLive
              ? "border-up/40 bg-up/10 text-up"
              : "border-border bg-surface-2 text-muted"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isLive ? "bg-up" : "bg-muted"}`} />
          {isLive ? "Live API" : "Sample data"}
        </span>
      </div>
    </header>
  );
}
