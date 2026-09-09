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
  | "card"
  | "copytrade"
  | "launchpad";

const PATHS: Record<IconKey, string> = {
  dashboard: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
  leaderboard: "M4 20h4v-8H4v8Zm6 0h4V4h-4v16Zm6 0h4v-6h-4v6Z",
  feed: "M13 2 3 14h7l-1 8 10-12h-7l1-8Z",
  token: "M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z",
  alerts: "M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6-2-2v-4a5 5 0 0 0-4-4.9V4a1 1 0 0 0-2 0v1.1A5 5 0 0 0 7 10v4l-2 2v1h14v-1Z",
  trader: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z",
  card: "M3 6h18v12H3zM7 10a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8ZM5 14.5c0-1.3 1-2 2-2s2 .7 2 2M13 9h5M13 12.5h5M13 15.5h3",
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
  { href: "/card", label: "Trader Card", icon: "card" },
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

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-border-soft bg-surface/30 p-4 backdrop-blur-sm">
      <div className="mb-8 flex items-center gap-3 px-1 pt-1">
        <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border ring-1 ring-brand/25 shadow-glow-sm">
          <img src="/pea-logo.jpg" alt="PEA" width={44} height={44} className="h-full w-full object-cover" />
        </span>
        <div className="leading-tight">
          <div className="font-display text-[17px] font-black tracking-tight">PEA</div>
          <div className="eyebrow mt-0.5 !tracking-[0.16em]">fomo companion</div>
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
              {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand shadow-[0_0_10px] shadow-brand" />}
              <span className={active ? "text-brand-bright" : "text-muted-2 group-hover:text-muted"}>
                <Icon k={item.icon} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3">
        <a
          href="https://x.com/peadotfamily"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand/40 hover:text-white"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-3 text-white">
            <XIcon />
          </span>
          <span className="leading-tight">
            <span className="block font-semibold text-white">Follow PEA</span>
            <span className="block text-[11px] text-muted-2">@peadotfamily</span>
          </span>
          <svg className="ml-auto h-3.5 w-3.5 text-muted-2 transition group-hover:text-brand-bright" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </a>
        <div className="rounded-xl2 border border-border bg-brand-soft p-4 text-xs text-muted">
          <div className="mb-1 flex items-center gap-1.5 font-display font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Robinhood Chain
          </div>
          Every token and signal on this app is Robinhood Chain only.
        </div>
      </div>
    </aside>
  );
}
