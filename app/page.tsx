import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import VolumeChart from "@/components/VolumeChart";
import { getMarketStats, getVolumeSeries, getTrending } from "@/lib/fomo-api";
import { fmtUsd, fmtNum, fmtPct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, volume, trending] = await Promise.all([
    getMarketStats(),
    getVolumeSeries(),
    getTrending(),
  ]);

  return (
    <>
      <Topbar title="Dashboard" subtitle="Market overview across the fomo ecosystem" />
      <div className="space-y-6 p-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="24h Volume" value={fmtUsd(stats.totalVolume24h, { compact: true })} changePct={stats.volumeChangePct} />
          <StatCard label="Active Traders" value={fmtNum(stats.activeTraders24h)} />
          <StatCard label="Trades (24h)" value={fmtNum(stats.totalTrades24h)} />
          <StatCard label="Avg Trade" value={fmtUsd(stats.totalVolume24h / Math.max(1, stats.totalTrades24h))} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Trading volume — last 24h</h2>
          </div>
          <VolumeChart data={volume} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold">Trending tokens</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="pb-3 font-medium">Token</th>
                  <th className="pb-3 font-medium">Chain</th>
                  <th className="pb-3 text-right font-medium">Price</th>
                  <th className="pb-3 text-right font-medium">24h</th>
                  <th className="pb-3 text-right font-medium">Volume</th>
                  <th className="hidden pb-3 text-right font-medium sm:table-cell">Buys / Sells</th>
                </tr>
              </thead>
              <tbody>
                {trending.map((t) => (
                  <tr key={t.symbol + t.address} className="border-t border-border/60">
                    <td className="py-3">
                      <div className="font-semibold">{t.symbol}</div>
                      <div className="text-xs text-muted">{t.name}</div>
                    </td>
                    <td className="py-3 text-muted">{t.chain}</td>
                    <td className="py-3 text-right tabular-nums">{fmtUsd(t.priceUsd)}</td>
                    <td className={`py-3 text-right font-medium tabular-nums ${t.change24hPct >= 0 ? "text-up" : "text-down"}`}>
                      {fmtPct(t.change24hPct)}
                    </td>
                    <td className="py-3 text-right tabular-nums">{fmtUsd(t.volume24h, { compact: true })}</td>
                    <td className="hidden py-3 text-right tabular-nums sm:table-cell">
                      <span className="text-up">{fmtNum(t.buys24h)}</span>
                      <span className="text-muted"> / </span>
                      <span className="text-down">{fmtNum(t.sells24h)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
