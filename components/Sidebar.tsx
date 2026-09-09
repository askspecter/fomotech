"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "◎" },
  { href: "/leaderboard", label: "Leaderboard", icon: "♛" },
  { href: "/feed", label: "Live Feed", icon: "⚡" },
  { href: "/tokens", label: "Token Intel", icon: "🛡" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 shrink-0 flex-col border-r border-border bg-surface/60 p-4">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-lg font-black text-white">
          f
        </span>
        <div className="leading-tight">
          <div className="font-bold tracking-tight">fomotech</div>
          <div className="text-[11px] text-muted">fomo.family companion</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-brand/15 text-white"
                  : "text-muted hover:bg-surface-2 hover:text-white"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border border-border bg-surface-2 p-3 text-xs text-muted">
        <div className="mb-1 font-semibold text-white">Never miss a move</div>
        Real-time signals from the fomo ecosystem.
      </div>
    </aside>
  );
}
