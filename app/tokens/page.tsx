"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import type { TokenIntel, TokenWindow } from "@/lib/types";
import { fmtUsd, fmtNum } from "@/lib/format";

const WINDOW_KEYS: ("5m" | "1h" | "4h" | "24h")[] = ["5m", "1h", "4h", "24h"];

export default function TokensPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [intel, setIntel] = useState<TokenIntel | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function scan(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Robinhood Chain only: the route defaults token stats to network 4663.
      const params = new URLSearchParams({ q, chain: "robinhood" });
      const res = await fetch(`/api/tokens?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setIntel(data.intel);
    } catch (err) {
      setError((err as Error).message);
      setIntel(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar title="Token Intel" subtitle="Robinhood Chain tokens: holders, flow, and dev signals" />
      <div className="p-5">
        <form onSubmit={scan} className="mb-6 flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Token symbol or contract address"
            className="inp min-w-[220px] flex-1"
          />
          <button type="submit" disabled={loading} className="btn-brand px-6 py-3 text-sm">
            {loading ? "Scanning" : "Scan"}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-down/40 bg-down/10 p-4 text-sm text-down">{error}</div>
        )}

        {intel && !intel.found && (
          <div className="card p-8 text-center text-muted">
            No token found for “{intel.query}”.
          </div>
        )}

        {intel && intel.found && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 card p-5">
              <div>
                <div className="text-xl font-bold">{intel.meta?.symbol ?? intel.query}</div>
                <div className="text-sm text-muted">{intel.meta?.name}</div>
                {intel.meta?.address && (
                  <div className="mt-1 break-all font-mono text-xs text-muted">{intel.meta.address}</div>
                )}
              </div>
              <div className="flex gap-6 text-right">
                {intel.meta?.marketCapUsd ? (
                  <div>
                    <div className="text-xs text-muted">Market cap</div>
                    <div className="font-semibold tabular-nums">{fmtUsd(intel.meta.marketCapUsd, { compact: true })}</div>
                  </div>
                ) : null}
                {intel.stats && (
                  <>
                    <div>
                      <div className="text-xs text-muted">Holders</div>
                      <div className="font-semibold tabular-nums">{fmtNum(intel.stats.holders)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Top 10 hold</div>
                      <div
                        className={`font-semibold tabular-nums ${
                          intel.stats.top10HoldersPercent > 40 ? "text-down" : "text-up"
                        }`}
                      >
                        {intel.stats.top10HoldersPercent.toFixed(1)}%
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Flow windows */}
            {intel.stats && (
              <div className="card p-5">
                <h3 className="mb-4 font-semibold">Flow</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {WINDOW_KEYS.map((k) => {
                    const w = intel.stats!.windows[k] as TokenWindow | undefined;
                    if (!w) return null;
                    const net = w.netVolumeUsd;
                    return (
                      <div key={k} className="rounded-xl border border-border bg-surface-2 p-4">
                        <div className="mb-2 text-xs uppercase tracking-wide text-muted">{k}</div>
                        <div className={`text-lg font-bold tabular-nums ${net >= 0 ? "text-up" : "text-down"}`}>
                          {net >= 0 ? "+" : ""}
                          {fmtUsd(net, { compact: true })}
                        </div>
                        <div className="mt-2 flex justify-between text-xs">
                          <span className="text-up">{fmtNum(w.buys)} buys</span>
                          <span className="text-down">{fmtNum(w.sells)} sells</span>
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          {w.uniqueBuyers}/{w.uniqueSellers} uniq · ratio {w.buySellRatio ?? "∞"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Smart-money holders */}
              <div className="card p-5">
                <h3 className="mb-3 font-semibold">Smart-money holders</h3>
                {intel.holders.length === 0 ? (
                  <p className="py-4 text-sm text-muted">No tracked holders.</p>
                ) : (
                  <ul className="space-y-2">
                    {intel.holders.map((h, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="font-medium">@{h.handle}</span>
                        <span className="tabular-nums text-muted">{fmtUsd(h.valueUsd, { compact: true })}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Devs / rug signal */}
              <div className="card p-5">
                <h3 className="mb-1 font-semibold">Dev positions</h3>
                <p className="mb-3 text-xs text-muted">
                  Empty means fomo knows of no dev holding, not a clean bill of health.
                </p>
                {intel.devs.length === 0 ? (
                  <p className="py-4 text-sm text-muted">No dev holdings reported.</p>
                ) : (
                  <ul className="space-y-3">
                    {intel.devs.map((d, i) => (
                      <li key={i} className="rounded-xl border border-border bg-surface-2 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{d.handle ? `@${d.handle}` : "dev"}</span>
                          <span className={`text-sm tabular-nums ${d.realizedPnlUsd >= 0 ? "text-up" : "text-down"}`}>
                            realized {fmtUsd(d.realizedPnlUsd, { compact: true })}
                          </span>
                        </div>
                        {d.thesis && <p className="mt-1 text-xs text-muted">“{d.thesis}”</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {!intel && !error && (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center text-muted">
            Enter a token to pull holders, flow, and dev positions from fomo.
          </div>
        )}
      </div>
    </>
  );
}
