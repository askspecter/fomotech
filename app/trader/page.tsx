"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import Verified from "@/components/Verified";
import Avatar from "@/components/Avatar";
import { useLocalList } from "@/lib/useLocalList";
import type { TraderProfile, UserTrade, Portfolio, SocialTrader } from "@/lib/types";
import { fmtUsd, fmtNum, fmtPct } from "@/lib/format";

interface TraderData {
  profile: TraderProfile;
  trades?: UserTrade[];
  portfolio?: Portfolio;
}

export default function TraderPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [data, setData] = useState<TraderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<SocialTrader[] | null>(null);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  const copy = useLocalList("pea.copytrade");
  const watch = useLocalList("pea.watch.traders");

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setFollowing(null);
    setData(null);
    try {
      // 1) Profile first — one fast call, shown immediately.
      const pr = await fetch(`/api/profile?handle=${encodeURIComponent(q)}`, { cache: "no-store" });
      const pb = await pr.json();
      if (!pr.ok || !pb.profile?.found) throw new Error("Trader not found on fomo");
      setData({ profile: pb.profile });
      setLoading(false);
      // 2) Trades + portfolio in the background (heavier calls).
      setDetailsLoading(true);
      fetch(`/api/trader?handle=${encodeURIComponent(pb.profile.handle)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((b) => setData((d) => (d ? { ...d, trades: b.trades, portfolio: b.portfolio } : d)))
        .catch(() => {})
        .finally(() => setDetailsLoading(false));
    } catch (err) {
      setError((err as Error).message);
      setData(null);
      setLoading(false);
    }
  }

  async function loadFollowing() {
    if (!data) return;
    setLoadingFollowing(true);
    try {
      const res = await fetch(`/api/trader/following?handle=${encodeURIComponent(data.profile.handle)}`, {
        cache: "no-store",
      });
      const body = await res.json();
      setFollowing(body.following ?? []);
    } finally {
      setLoadingFollowing(false);
    }
  }

  const p = data?.profile;

  return (
    <>
      <Topbar title="Trader Explorer" subtitle="Profile, portfolio, trade history, and who they follow" />
      <div className="p-5">
        <form onSubmit={lookup} className="mb-6 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="fomo handle, e.g. CryptoKaleo"
            className="min-w-[220px] flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-50"
          >
            {loading ? "Loading" : "Look up"}
          </button>
        </form>

        {error && <div className="rounded-xl border border-down/40 bg-down/10 p-4 text-sm text-down">{error}</div>}

        {p && !p.found && (
          <div className="card p-8 text-center text-muted">
            No trader found for that handle.
          </div>
        )}

        {p && p.found && (
          <div className="space-y-4">
            {/* Profile header */}
            <div className="flex flex-wrap items-start justify-between gap-4 card p-5">
              <div className="flex items-center gap-4">
                <Avatar image={p.profilePictureLink} handle={p.handle} size={56} />
                <div>
                  <div className="flex items-center gap-1.5 text-lg font-bold">
                    @{p.handle}
                    {p.verified && <Verified className="text-brand-bright" />}
                  </div>
                  <div className="text-sm text-muted">{p.displayName}</div>
                  {p.description && <p className="mt-1 max-w-md text-xs text-muted">{p.description}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copy.toggle(p.handle)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    copy.has(p.handle) ? "bg-up/15 text-up" : "bg-brand text-white hover:bg-brand-bright"
                  }`}
                >
                  {copy.has(p.handle) ? "Copying" : "Copy trader"}
                </button>
                <button
                  onClick={() => watch.toggle(p.handle)}
                  className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium hover:text-white"
                >
                  {watch.has(p.handle) ? "Watching" : "Watch"}
                </button>
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="PnL (all)" value={fmtUsd(p.pnl.all, { compact: true })} tone={p.pnl.all >= 0 ? "up" : "down"} />
              <Stat label="PnL (24h)" value={fmtUsd(p.pnl["24h"], { compact: true })} tone={p.pnl["24h"] >= 0 ? "up" : "down"} />
              <Stat label="Volume" value={fmtUsd(p.volumeUsd, { compact: true })} />
              <Stat label="Followers" value={fmtNum(p.followers)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Portfolio */}
              <div className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Portfolio</h3>
                  {data?.portfolio && (
                    <span className="text-sm font-semibold tabular-nums">
                      {fmtUsd(data.portfolio.totalValueUsd, { compact: true })}
                    </span>
                  )}
                </div>
                {detailsLoading && !data?.portfolio ? (
                  <div className="space-y-2 py-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-6 w-full skeleton" />
                    ))}
                  </div>
                ) : !data?.portfolio || data.portfolio.holdings.length === 0 ? (
                  <p className="py-4 text-sm text-muted">No holdings.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.portfolio.holdings.map((h, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span>
                          <span className="font-medium">{h.tokenSymbol}</span>
                          <span className="ml-2 text-xs capitalize text-muted">{h.chain}</span>
                        </span>
                        <span className="tabular-nums">{fmtUsd(h.valueUsd, { compact: true })}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recent trades */}
              <div className="card p-5">
                <h3 className="mb-3 font-semibold">Recent trades</h3>
                {detailsLoading && !data?.trades ? (
                  <div className="space-y-2 py-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-6 w-full skeleton" />
                    ))}
                  </div>
                ) : !data?.trades || data.trades.length === 0 ? (
                  <p className="py-4 text-sm text-muted">No trades available.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.trades.slice(0, 10).map((t) => {
                      const pnl = t.status === "open" ? t.unrealizedPnlUsd : t.realizedPnlUsd;
                      return (
                        <li key={t.tradeId} className="flex items-center justify-between text-sm">
                          <span>
                            <span className="font-medium">{t.tokenSymbol}</span>
                            <span
                              className={`ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase ${
                                t.status === "open" ? "bg-brand/15 text-brand-bright" : "bg-surface-2 text-muted"
                              }`}
                            >
                              {t.status}
                            </span>
                          </span>
                          <span className={`tabular-nums ${pnl >= 0 ? "text-up" : "text-down"}`}>
                            {fmtUsd(pnl, { compact: true })}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Following (discovery) */}
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Who they follow</h3>
                {following === null && (
                  <button
                    onClick={loadFollowing}
                    disabled={loadingFollowing}
                    className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:text-white disabled:opacity-50"
                  >
                    {loadingFollowing ? "Loading" : "Load following"}
                  </button>
                )}
              </div>
              {following !== null &&
                (following.length === 0 ? (
                  <p className="py-4 text-sm text-muted">No following returned.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-muted">
                          <th className="pb-2 font-medium">Trader</th>
                          <th className="pb-2 text-right font-medium">PnL 24h</th>
                          <th className="pb-2 text-right font-medium">Volume</th>
                          <th className="pb-2 text-right font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {following.map((f) => (
                          <tr key={f.handle} className="border-t border-border/60">
                            <td className="py-2">
                              <span className="inline-flex items-center gap-2.5 font-medium">
                                <Avatar handle={f.handle} size={28} />
                                <span className="inline-flex items-center gap-1">
                                  @{f.handle}
                                  {f.verified && <Verified className="text-brand-bright" />}
                                </span>
                              </span>
                            </td>
                            <td className={`py-2 text-right tabular-nums ${f.pnl24h >= 0 ? "text-up" : "text-down"}`}>
                              {fmtUsd(f.pnl24h, { compact: true })}
                            </td>
                            <td className="py-2 text-right tabular-nums">{fmtUsd(f.volumeUsd, { compact: true })}</td>
                            <td className="py-2 text-right">
                              <button
                                onClick={() => setQ(f.handle)}
                                className="text-xs text-brand-bright hover:underline"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
            </div>
          </div>
        )}

        {!p && !error && (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center text-muted">
            Enter a fomo handle to see their profile, portfolio, and trades.
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className={`mt-1 text-xl font-bold tabular-nums ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : ""}`}>
        {value}
      </div>
    </div>
  );
}
