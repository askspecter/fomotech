"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import Verified from "@/components/Verified";
import { useLocalList } from "@/lib/useLocalList";
import type { Trader } from "@/lib/types";
import { fmtUsd, fmtNum } from "@/lib/format";

export default function CopytradePage() {
  const copy = useLocalList("fomotech.copytrade");
  const [matched, setMatched] = useState<Trader[]>([]);
  const [misses, setMisses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (copy.items.length === 0) {
      setMatched([]);
      setMisses([]);
      return;
    }
    let active = true;
    setLoading(true);
    fetch(`/api/copytrade?handles=${encodeURIComponent(copy.items.join(","))}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => {
        if (!active) return;
        setMatched(b.matched ?? []);
        setMisses(b.misses ?? []);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [copy.items]);

  const totalPnl = matched.reduce((s, t) => s + t.pnlUsd, 0);
  const totalVol = matched.reduce((s, t) => s + t.volumeUsd, 0);

  function addHandle(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    copy.add(input);
    setInput("");
  }

  return (
    <>
      <Topbar title="Copytrade" subtitle="Track the traders you copy, ranked by 24h PnL" />
      <div className="space-y-6 p-5">
        <form onSubmit={addHandle} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a fomo handle to copy"
            className="min-w-[220px] flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <button type="submit" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-bright">
            Add
          </button>
        </form>

        {copy.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center text-muted">
            No copied traders yet. Add a handle above, or open the{" "}
            <Link href="/trader" className="text-brand-bright hover:underline">
              Trader Explorer
            </Link>{" "}
            and press Copy trader.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <Stat label="Copied traders" value={String(copy.items.length)} />
              <Stat label="Combined 24h PnL" value={fmtUsd(totalPnl, { compact: true })} tone={totalPnl >= 0 ? "up" : "down"} />
              <Stat label="Combined 24h volume" value={fmtUsd(totalVol, { compact: true })} />
            </div>

            {loading && <p className="text-sm text-muted">Loading performance</p>}

            {matched.length > 0 && (
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-5 py-4 font-medium">Rank</th>
                      <th className="px-5 py-4 font-medium">Trader</th>
                      <th className="px-5 py-4 text-right font-medium">24h PnL</th>
                      <th className="hidden px-5 py-4 text-right font-medium md:table-cell">Volume</th>
                      <th className="hidden px-5 py-4 text-right font-medium md:table-cell">Trades</th>
                      <th className="px-5 py-4 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {matched.map((t) => (
                      <tr key={t.handle} className="border-t border-border/60">
                        <td className="px-5 py-4 text-muted">{t.rank}</td>
                        <td className="px-5 py-4">
                          <Link href="/trader" className="inline-flex items-center gap-1 font-medium hover:text-brand-bright">
                            @{t.handle}
                            {t.verified && <Verified className="text-brand-bright" />}
                          </Link>
                        </td>
                        <td className={`px-5 py-4 text-right font-semibold tabular-nums ${t.pnlUsd >= 0 ? "text-up" : "text-down"}`}>
                          {fmtUsd(t.pnlUsd, { compact: true })}
                        </td>
                        <td className="hidden px-5 py-4 text-right tabular-nums md:table-cell">{fmtUsd(t.volumeUsd, { compact: true })}</td>
                        <td className="hidden px-5 py-4 text-right tabular-nums md:table-cell">{fmtNum(t.trades)}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => copy.remove(t.handle)} className="text-xs text-muted hover:text-down">
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {misses.length > 0 && (
              <div className="card p-5">
                <h3 className="mb-2 text-sm font-semibold">Not in the 24h top 150</h3>
                <p className="mb-3 text-xs text-muted">
                  These copied traders are outside today top board, so live stats are not shown here. Open the explorer for their full profile.
                </p>
                <div className="flex flex-wrap gap-2">
                  {misses.map((h) => (
                    <span key={h} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm">
                      @{h}
                      <button onClick={() => copy.remove(h)} className="text-xs text-muted hover:text-down">
                        x
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
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
