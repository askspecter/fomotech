import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import PnlBarChart from "@/components/PnlBarChart";
import WindowTabs from "@/components/WindowTabs";
import { getLeaderboard, deriveMarketStats, getTrending } from "@/lib/fomo-api";
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
      <div className="space-y-6 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">
            Aggregated from the top {stats.activeTraders} traders
          </span>
          <WindowTabs active={window} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard accent label={`Volume (${window})`} value={fmtUsd(stats.totalVolumeUsd, { compact: true })} />
          <StatCard
            label={`Net PnL (${window})`}
            value={fmtUsd(stats.totalPnlUsd, { compact: true })}
            tone={stats.totalPnlUsd >= 0 ? "up" : "down"}
          />
          <StatCard label="Traders" value={fmtNum(stats.activeTraders)} />
          <StatCard label={`Trades (${window})`} value={fmtNum(stats.totalTrades)} />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-base font-semibold">Top traders by PnL</h2>
          <PnlBarChart data={topPnl} />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-base font-semibold">Trending tokens on fomo</h2>
          {trending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Board not available right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Token</th>
                    <th className="pb-3 font-medium">Chain</th>
                    <th className="pb-3 text-right font-medium">Price</th>
                    <th className="pb-3 text-right font-medium">24h</th>
                    <th className="hidden pb-3 text-right font-medium sm:table-cell">Mkt cap</th>
                    <th className="hidden pb-3 text-right font-medium sm:table-cell">FOMO buyers</th>
                  </tr>
                </thead>
                <tbody>
                  {trending.map((t) => (
                    <tr key={t.rank + t.address} className="border-t border-border/60">
                      <td className="py-3 text-muted">{t.rank}</td>
                      <td className="py-3">
                        <div className="font-semibold">{t.symbol}</div>
                        <div className="text-xs text-muted">{t.name}</div>
                      </td>
                      <td className="py-3 capitalize text-muted">{t.network}</td>
                      <td className="py-3 text-right tabular-nums">{fmtUsd(t.priceUsd)}</td>
                      <td className={`py-3 text-right font-medium tabular-nums ${t.change24h >= 0 ? "text-up" : "text-down"}`}>
                        {fmtPct(t.change24h)}
                      </td>
                      <td className="hidden py-3 text-right tabular-nums sm:table-cell">
                        {fmtUsd(t.marketCapUsd, { compact: true })}
                      </td>
                      <td className="hidden py-3 text-right tabular-nums sm:table-cell">{fmtNum(t.fomoBuyers)}</td>
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
