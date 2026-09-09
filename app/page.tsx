import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import PnlBarChart from "@/components/PnlBarChart";
import WindowTabs from "@/components/WindowTabs";
import TokenLogo from "@/components/TokenLogo";
import { getLeaderboard, deriveMarketStats, getTrending, isLive } from "@/lib/fomo-api";
import { fmtUsd, fmtNum, fmtPct } from "@/lib/format";
import type { LeaderboardWindow } from "@/lib/types";

export const dynamic = "force-dynamic";

const WINDOWS: LeaderboardWindow[] = ["24h", "7d", "30d", "all"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { window?: string };
}) {
  const window = (WINDOWS.includes(searchParams.window as LeaderboardWindow)
    ? searchParams.window
    : "24h") as LeaderboardWindow;

  const [traders, trending] = await Promise.all([getLeaderboard(window, 50), getTrending(10)]);
  const stats = deriveMarketStats(traders, window);
  const topPnl = traders.slice(0, 10).map((t) => ({ handle: t.handle, pnlUsd: t.pnlUsd }));

  return (
    <>
      <Topbar title="Dashboard" subtitle="Market overview across the fomo ecosystem" />
      <div className="space-y-7 p-5">
        {/* Cinematic hero band */}
        <section className="rise card relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-brand-soft opacity-60" />
          <img
            src="/pea-logo.jpg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute -right-8 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-3xl opacity-[0.14] mix-blend-screen lg:block"
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <div className="eyebrow flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px] shadow-brand" />
                PEA · fomo companion
              </div>
              <h1 className="mt-3 font-display text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl">
                The <span className="gradient-text">fomo</span> market,
                <br className="hidden sm:block" /> in one command deck.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Live leaderboard, signal feed, and token intel — aggregated from the top{" "}
                <span className="font-semibold text-white">{stats.activeTraders}</span> traders on Robinhood Chain.
              </p>
            </div>
            <div className="shrink-0">
              <WindowTabs active={window} />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            <StatCard key="v" accent label={`Volume (${window})`} value={fmtUsd(stats.totalVolumeUsd, { compact: true })} />,
            <StatCard
              key="p"
              label={`Net PnL (${window})`}
              value={fmtUsd(stats.totalPnlUsd, { compact: true })}
              tone={stats.totalPnlUsd >= 0 ? "up" : "down"}
            />,
            <StatCard key="t" label="Traders" value={fmtNum(stats.activeTraders)} />,
            <StatCard key="x" label={`Trades (${window})`} value={fmtNum(stats.totalTrades)} />,
          ].map((el, i) => (
            <div key={i} className="rise-2" style={{ animationDelay: `${i * 70}ms` }}>
              {el}
            </div>
          ))}
        </div>

        <div className="card p-5 sm:p-6">
          <div className="mb-5">
            <div className="eyebrow">Performance</div>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight">Top traders by PnL</h2>
          </div>
          <PnlBarChart data={topPnl} />
        </div>

        <div className="card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="eyebrow">Market</div>
              <h2 className="mt-1 font-display text-lg font-bold tracking-tight">Trending tokens on fomo</h2>
            </div>
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-up/12 px-2.5 py-1 text-[11px] font-medium text-up">
                <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_6px] shadow-up" />
                Live prices
              </span>
            ) : (
              <span
                className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted-2"
                title="Set FOMO_API_KEY and NEXT_PUBLIC_FOMO_DATA_SOURCE=live for real prices and logos."
              >
                Sample data
              </span>
            )}
          </div>
          {trending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Board not available right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Token</th>
                    <th className="pb-3 text-right font-medium">Price</th>
                    <th className="pb-3 text-right font-medium">24h</th>
                    <th className="hidden pb-3 text-right font-medium sm:table-cell">Mkt cap</th>
                    <th className="hidden pb-3 text-right font-medium sm:table-cell">FOMO buyers</th>
                  </tr>
                </thead>
                <tbody>
                  {trending.map((t) => (
                    <tr
                      key={t.rank + t.address}
                      className="border-t border-border/60 transition-colors hover:bg-surface-2/50"
                    >
                      <td className="py-3 pl-2 tabular-nums text-muted-2">{t.rank}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <TokenLogo image={t.image} symbol={t.symbol} />
                          <div className="min-w-0">
                            <div className="font-semibold">{t.symbol}</div>
                            <div className="truncate text-xs text-muted">{t.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right font-medium tabular-nums">{fmtUsd(t.priceUsd)}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                            t.change24h >= 0 ? "bg-up/12 text-up" : "bg-down/12 text-down"
                          }`}
                        >
                          {fmtPct(t.change24h)}
                        </span>
                      </td>
                      <td className="hidden py-3 pr-1 text-right tabular-nums text-muted sm:table-cell">
                        {fmtUsd(t.marketCapUsd, { compact: true })}
                      </td>
                      <td className="hidden py-3 pr-2 text-right tabular-nums sm:table-cell">{fmtNum(t.fomoBuyers)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
