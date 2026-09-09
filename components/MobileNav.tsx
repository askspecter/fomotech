"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type IconKey =
  | "dashboard"
  | "leaderboard"
  | "feed"
  | "token"
  | "alerts"
  | "trader"
  | "copytrade"
  | "launchpad"
  | "more";

const PATHS: Record<IconKey, string> = {
  dashboard: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
  leaderboard: "M4 20h4v-8H4v8Zm6 0h4V4h-4v16Zm6 0h4v-6h-4v6Z",
  feed: "M13 2 3 14h7l-1 8 10-12h-7l1-8Z",
  token: "M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z",
  alerts: "M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6-2-2v-4a5 5 0 0 0-4-4.9V4a1 1 0 0 0-2 0v1.1A5 5 0 0 0 7 10v4l-2 2v1h14v-1Z",
  trader: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z",
  copytrade: "M8 8V5l-5 4 5 4v-3h9V8H8Zm8 8v-3l5 4-5 4v-3H7v-2h9Z",
  launchpad: "M5 19c2-1 3-3 3-5l9-9c1-1 3-1 3-1s0 2-1 3l-9 9c-2 0-4 1-5 3Zm9-11 2 2M5 14l-2 2 3 1 1 3 2-2",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};

function Icon({ k }: { k: IconKey }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[k]} />
    </svg>
  );
}

const PRIMARY: { href: string; label: string; icon: IconKey }[] = [
  { href: "/", label: "Home", icon: "dashboard" },
  { href: "/leaderboard", label: "Board", icon: "leaderboard" },
  { href: "/feed", label: "Feed", icon: "feed" },
  { href: "/trader", label: "Trader", icon: "trader" },
  { href: "/launchpad", label: "Launch", icon: "launchpad" },
];

const MORE: { href: string; label: string; icon: IconKey }[] = [
  { href: "/tokens", label: "Token Intel", icon: "token" },
  { href: "/alerts", label: "Alerts", icon: "alerts" },
  { href: "/copytrade", label: "Copytrade", icon: "copytrade" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const moreActive = MORE.some((m) => isActive(m.href));

  return (
    <>
      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-3 bottom-[76px] z-40 rise rounded-xl2 border border-border bg-surface p-2 shadow-card md:hidden">
            {MORE.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                  isActive(m.href) ? "bg-brand/12 text-white" : "text-muted"
                }`}
              >
                <span className={isActive(m.href) ? "text-brand-bright" : "text-muted-2"}>
                  <Icon k={m.icon} />
                </span>
                {m.label}
              </Link>
            ))}
          </div>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-bg/85 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {PRIMARY.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                  active ? "text-brand-bright" : "text-muted-2"
                }`}
              >
                <Icon k={item.icon} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setOpen((o) => !o)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
              open || moreActive ? "text-brand-bright" : "text-muted-2"
            }`}
          >
            <Icon k="more" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
