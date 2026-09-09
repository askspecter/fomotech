"use client";

import { useEffect, useRef, useState } from "react";
import Topbar from "@/components/Topbar";
import { useLocalList } from "@/lib/useLocalList";
import type { Alert } from "@/lib/types";
import { fmtUsd, timeAgo } from "@/lib/format";

const POLL_MS = Number(process.env.NEXT_PUBLIC_FEED_POLL_MS ?? 15000);
const WHALE_USD = 25000;

export default function AlertsPage() {
  const traders = useLocalList("fomotech.watch.traders");
  const tokens = useLocalList("fomotech.watch.tokens");

  const [hits, setHits] = useState<Alert[]>([]);
  const [whaleMoves, setWhaleMoves] = useState(true);
  const [traderInput, setTraderInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    async function tick() {
      try {
        const res = await fetch("/api/feed", { cache: "no-store" });
        const { alerts } = (await res.json()) as { alerts: Alert[] };
        if (!active || !alerts) return;
        const watchedTraders = traders.items.map((t) => t.toLowerCase());
        const watchedTokens = tokens.items.map((t) => t.toLowerCase());
        const fresh = alerts.filter((a) => {
          if (seen.current.has(a.id)) return false;
          const matchTrader = a.trader && watchedTraders.includes(a.trader.toLowerCase());
          const matchToken = a.token && watchedTokens.includes(a.token.toLowerCase());
          const isWhale = whaleMoves && (a.alertType === "whale" || (a.usdValue ?? 0) >= WHALE_USD);
          return matchTrader || matchToken || isWhale;
        });
        fresh.forEach((a) => seen.current.add(a.id));
        if (fresh.length) setHits((prev) => [...fresh, ...prev].sort((a, b) => b.ts - a.ts).slice(0, 100));
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
  }, [traders.items, tokens.items, whaleMoves]);

  return (
    <>
      <Topbar title="Alerts" subtitle="Watch traders and tokens, catch whale moves as they happen" />
      <div className="grid gap-5 p-5 lg:grid-cols-[320px_1fr]">
        {/* Watchlist controls */}
        <div className="space-y-4">
          <WatchBox
            title="Watched traders"
            placeholder="fomo handle"
            value={traderInput}
            setValue={setTraderInput}
            onAdd={() => {
              traders.add(traderInput);
              setTraderInput("");
            }}
            items={traders.items}
            onRemove={traders.remove}
          />
          <WatchBox
            title="Watched tokens"
            placeholder="token symbol"
            value={tokenInput}
            setValue={setTokenInput}
            onAdd={() => {
              tokens.add(tokenInput);
              setTokenInput("");
            }}
            items={tokens.items}
            onRemove={tokens.remove}
          />
          <label className="flex items-center gap-2 rounded-xl border border-border bg-surface p-4 text-sm">
            <input type="checkbox" checked={whaleMoves} onChange={(e) => setWhaleMoves(e.target.checked)} className="h-4 w-4 accent-brand" />
            Include whale moves over {fmtUsd(WHALE_USD, { compact: true })}
          </label>
        </div>

        {/* Alert stream */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Triggered alerts</h2>
            <span className="text-xs text-muted">refresh {POLL_MS / 1000}s</span>
          </div>
          <div className="space-y-2">
            {hits.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
                {traders.items.length + tokens.items.length === 0 && !whaleMoves
                  ? "Add a trader or token to watch, or enable whale moves."
                  : "Waiting for a matching event."}
              </div>
            )}
            {hits.map((a) => (
              <div key={a.id} className="flash flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3">
                <span
                  className={`w-16 shrink-0 rounded-md px-2 py-0.5 text-center text-xs font-bold uppercase ${
                    a.alertType === "buy"
                      ? "bg-up/15 text-up"
                      : a.alertType === "sell"
                        ? "bg-down/15 text-down"
                        : "bg-yellow-500/15 text-yellow-400"
                  }`}
                >
                  {a.alertType}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{a.text || `${a.trader ?? ""} ${a.token ?? ""}`}</div>
                  {a.chain && <div className="text-xs capitalize text-muted">{a.chain}</div>}
                </div>
                <div className="text-right">
                  {a.usdValue != null && <div className="font-semibold tabular-nums">{fmtUsd(a.usdValue, { compact: true })}</div>}
                  <div className="text-xs text-muted">{timeAgo(a.ts)} ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function WatchBox({
  title,
  placeholder,
  value,
  setValue,
  onAdd,
  items,
  onRemove,
}: {
  title: string;
  placeholder: string;
  value: string;
  setValue: (v: string) => void;
  onAdd: () => void;
  items: string[];
  onRemove: (v: string) => void;
}) {
  return (
    <div className="card p-4">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAdd();
        }}
        className="mb-3 flex gap-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-bright">
          Add
        </button>
      </form>
      {items.length === 0 ? (
        <p className="text-xs text-muted">Nothing yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <span key={it} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-sm">
              {it}
              <button onClick={() => onRemove(it)} className="text-xs text-muted hover:text-down">
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
