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
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand font-display text-lg font-black text-white shadow-glow md:hidden">
            f
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`chip ${isLive ? "border-up/40 bg-up/10 text-up" : "text-muted"}`}
          >
            <span className={`h-2 w-2 rounded-full ${isLive ? "bg-up shadow-[0_0_8px] shadow-up" : "bg-muted-2"}`} />
            <span className="hidden sm:inline">{isLive ? "Live API" : "Sample data"}</span>
          </span>
          {wallet && <WalletButton />}
        </div>
      </div>
    </header>
  );
}
