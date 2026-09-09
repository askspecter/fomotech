"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { LeaderboardWindow } from "@/lib/types";

const WINDOWS: LeaderboardWindow[] = ["24h", "7d", "30d", "all"];

export default function WindowTabs({ active }: { active: LeaderboardWindow }) {
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-1 text-sm">
      {WINDOWS.map((w) => {
        const next = new URLSearchParams(params);
        next.set("window", w);
        return (
          <Link
            key={w}
            href={`${pathname}?${next.toString()}`}
            className={`rounded-md px-3 py-1 font-medium transition ${
              active === w ? "bg-brand text-white" : "text-muted hover:text-white"
            }`}
          >
            {w}
          </Link>
        );
      })}
    </div>
  );
}
