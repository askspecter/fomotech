import { isLive } from "@/lib/fomo-api";
import { WalletButton } from "./WalletButton";

export default function Topbar({
  title,
  subtitle,
  wallet = false,
}: {
  title: string;
  subtitle?: string;
  wallet?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border-soft bg-bg/70 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Brand mark, shown on mobile where the sidebar is hidden. */}
          <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-border ring-1 ring-brand/25 shadow-glow-sm md:hidden">
            <img src="/pea-logo.jpg" alt="PEA" width={36} height={36} className="h-full w-full object-cover" />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="chip hidden text-brand-bright sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Robinhood Chain
          </span>
          <span className={`chip ${isLive ? "border-brand/40 text-brand-bright" : "text-muted"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-brand" : "bg-muted-2"}`} />
            <span className="hidden sm:inline">{isLive ? "Live" : "Sample data"}</span>
          </span>
          {wallet && <WalletButton />}
        </div>
      </div>
    </header>
  );
}
