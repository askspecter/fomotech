"use client";

import { useEffect, useRef, useState } from "react";
import Topbar from "@/components/Topbar";
import Avatar from "@/components/Avatar";
import type { Alert } from "@/lib/types";
import { fmtUsd, timeAgo } from "@/lib/format";

const POLL_MS = Number(process.env.NEXT_PUBLIC_FEED_POLL_MS ?? 15000);

type Filter = "all" | "buy" | "sell" | "thesis" | "whale";

const TYPE_STYLE: Record<string, string> = {
  buy: "bg-up/15 text-up",
  sell: "bg-down/15 text-down",
  thesis: "bg-brand/15 text-brand-bright",
  whale: "bg-yellow-500/15 text-yellow-400",
  price: "bg-surface-2 text-muted",
  trade: "bg-surface-2 text-muted",
  follow: "bg-surface-2 text-muted",
};

export default function FeedPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    async function tick() {
      if (paused) return;
      try {
        const res = await fetch("/api/feed", { cache: "no-store" });
        const { alerts } = (await res.json()) as { alerts: Alert[] };
        if (!active || !alerts) return;
        const fresh = alerts.filter((a) => !seen.current.has(a.id));
        fresh.forEach((a) => seen.current.add(a.id));
        if (fresh.length) {
          setAlerts((prev) =>
            [...fresh, ...prev].sort((a, b) => b.ts - a.ts).slice(0, 100),
          );
        }
      } catch {
        /* transient */
      }
    }
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [paused]);

  const shown = filter === "all" ? alerts : alerts.filter((a) => a.alertType === filter);

  return (
    <>
      <Topbar title="Live Feed" subtitle={`fomo activity firehose · refresh ${POLL_MS / 1000}s`} />
      <div className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPaused((p) => !p)}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <div className="inline-flex rounded-lg border border-border bg-surface p-1 text-sm">
            {(["all", "buy", "sell", "thesis", "whale"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1 font-medium capitalize transition ${
                  filter === f ? "bg-brand text-white" : "text-muted hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-muted">{shown.length} events</span>
        </div>

        <div className="space-y-2">
          {shown.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
              Listening for activity…
            </div>
          )}
          {shown.map((a) => (
            <div
              key={a.id}
              className="flash flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3"
            >
              {a.trader ? (
                <Avatar handle={a.trader} size={36} />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border-soft bg-surface-2 text-muted-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z" /></svg>
                </span>
              )}
              <span
                className={`hidden w-16 shrink-0 rounded-md px-2 py-0.5 text-center text-xs font-bold uppercase sm:block ${
                  TYPE_STYLE[a.alertType] ?? "bg-surface-2 text-muted"
                }`}
              >
                {a.alertType}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{a.text || `${a.trader ?? ""} · ${a.token ?? ""}`}</div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  {a.chain && <span className="capitalize">{a.chain}</span>}
                  {a.source === "push" && <span>push</span>}
                </div>
              </div>
              <div className="text-right">
                {a.usdValue != null && (
                  <div className="font-semibold tabular-nums">{fmtUsd(a.usdValue, { compact: true })}</div>
                )}
                <div className="text-xs text-muted">{timeAgo(a.ts)} ago</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
