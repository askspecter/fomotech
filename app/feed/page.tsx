"use client";

import { useEffect, useRef, useState } from "react";
import Topbar from "@/components/Topbar";
import type { FeedTrade } from "@/lib/types";
import { fmtUsd, timeAgo } from "@/lib/format";

export default function FeedPage() {
  const [trades, setTrades] = useState<FeedTrade[]>([]);
  const [paused, setPaused] = useState(false);
  const [whaleOnly, setWhaleOnly] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    async function tick() {
      if (paused) return;
      try {
        const res = await fetch("/api/feed", { cache: "no-store" });
        const { feed } = (await res.json()) as { feed: FeedTrade[] };
        if (!active) return;
        const fresh = feed.filter((t) => !seen.current.has(t.id));
        fresh.forEach((t) => seen.current.add(t.id));
        if (fresh.length) {
          setTrades((prev) => [...fresh, ...prev].slice(0, 80));
        }
      } catch {
        /* ignore transient errors */
      }
    }
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [paused]);

  const shown = whaleOnly ? trades.filter((t) => t.isWhale) : trades;

  return (
    <>
      <Topbar title="Live Feed" subtitle="Real-time trades across the fomo ecosystem" />
      <div className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPaused((p) => !p)}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={whaleOnly}
              onChange={(e) => setWhaleOnly(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            🐋 Whales only ({">"}$25k)
          </label>
          <span className="ml-auto text-xs text-muted">{shown.length} trades</span>
        </div>

        <div className="space-y-2">
          {shown.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
              Listening for trades…
            </div>
          )}
          {shown.map((t) => (
            <div
              key={t.id}
              className="flash flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${
                  t.side === "buy" ? "bg-up/15 text-up" : "bg-down/15 text-down"
                }`}
              >
                {t.side}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">
                  <span className="font-semibold">@{t.traderHandle}</span>{" "}
                  <span className="text-muted">{t.side === "buy" ? "bought" : "sold"}</span>{" "}
                  <span className="font-semibold">{t.tokenSymbol}</span>
                  {t.isWhale && <span className="ml-2">🐋</span>}
                </div>
                <div className="text-xs text-muted">{t.chain}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold tabular-nums">{fmtUsd(t.amountUsd, { compact: true })}</div>
                <div className="text-xs text-muted">{timeAgo(t.time)} ago</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
