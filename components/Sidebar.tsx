"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconKey =
  | "dashboard"
  | "leaderboard"
  | "feed"
  | "token"
  | "alerts"
  | "trader"
  | "copytrade"
  | "launchpad";

const PATHS: Record<IconKey, string> = {
  dashboard: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
  leaderboard: "M4 20h4v-8H4v8Zm6 0h4V4h-4v16Zm6 0h4v-6h-4v6Z",
  feed: "M13 2 3 14h7l-1 8 10-12h-7l1-8Z",
  token: "M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z",
  alerts: "M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6-2-2v-4a5 5 0 0 0-4-4.9V4a1 1 0 0 0-2 0v1.1A5 5 0 0 0 7 10v4l-2 2v1h14v-1Z",
  trader: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z",
  copytrade: "M8 8V5l-5 4 5 4v-3h9V8H8Zm8 8v-3l5 4-5 4v-3H7v-2h9Z",
  launchpad: "M5 19c2-1 3-3 3-5l9-9c1-1 3-1 3-1s0 2-1 3l-9 9c-2 0-4 1-5 3Zm9-11 2 2M5 14l-2 2 3 1 1 3 2-2",
};

const NAV: { href: string; label: string; icon: IconKey }[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
  { href: "/feed", label: "Live Feed", icon: "feed" },
  { href: "/tokens", label: "Token Intel", icon: "token" },
  { href: "/alerts", label: "Alerts", icon: "alerts" },
  { href: "/trader", label: "Trader Explorer", icon: "trader" },
  { href: "/copytrade", label: "Copytrade", icon: "copytrade" },
  { href: "/launchpad", label: "Launchpad", icon: "launchpad" },
];

function Icon({ k }: { k: IconKey }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[k]} />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-border-soft bg-surface/40 p-4">
      <div className="mb-8 flex items-center gap-2.5 px-2 pt-1">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand font-display text-xl font-black text-white shadow-glow">
          P
        </span>
        <div className="leading-tight">
          <div className="font-display text-[15px] font-bold tracking-tight">PEA</div>
          <div className="text-[11px] text-muted-2">fomo companion</div>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand/12 text-white"
                  : "text-muted hover:bg-surface-2/70 hover:text-white"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand" />}
              <span className={active ? "text-brand-bright" : "text-muted-2 group-hover:text-muted"}>
                <Icon k={item.icon} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl2 border border-border bg-brand-soft p-4 text-xs text-muted">
        <div className="mb-1 flex items-center gap-1.5 font-display font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_8px] shadow-brand" />
          Robinhood Chain
        </div>
        Every token and signal on this app is Robinhood Chain only.
      </div>
    </aside>
  );
}
