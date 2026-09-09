import Topbar from "@/components/Topbar";
import { getLeaderboard } from "@/lib/fomo-api";
import { fmtUsd, fmtNum, fmtPct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const traders = await getLeaderboard();

  return (
    <>
      <Topbar title="Leaderboard" subtitle="Top traders by realized PnL" />
      <div className="p-5">
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-4 font-medium">#</th>
                <th className="px-5 py-4 font-medium">Trader</th>
                <th className="px-5 py-4 text-right font-medium">PnL</th>
                <th className="px-5 py-4 text-right font-medium">ROI</th>
                <th className="hidden px-5 py-4 text-right font-medium md:table-cell">Volume</th>
                <th className="hidden px-5 py-4 text-right font-medium md:table-cell">Win rate</th>
                <th className="hidden px-5 py-4 text-right font-medium lg:table-cell">Followers</th>
              </tr>
            </thead>
            <tbody>
              {traders.map((t) => (
                <tr key={t.address} className="border-t border-border/60 hover:bg-surface-2/50">
                  <td className="px-5 py-4">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold ${
                        t.rank <= 3 ? "bg-brand/20 text-brand-bright" : "text-muted"
                      }`}
                    >
                      {t.rank}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold">@{t.handle}</div>
                    <div className="font-mono text-xs text-muted">{t.address}</div>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums text-up">
                    {fmtUsd(t.pnlUsd, { compact: true })}
                  </td>
                  <td className="px-5 py-4 text-right font-medium tabular-nums text-up">{fmtPct(t.pnlPct)}</td>
                  <td className="hidden px-5 py-4 text-right tabular-nums md:table-cell">
                    {fmtUsd(t.volumeUsd, { compact: true })}
                  </td>
                  <td className="hidden px-5 py-4 text-right tabular-nums md:table-cell">{t.winRatePct.toFixed(0)}%</td>
                  <td className="hidden px-5 py-4 text-right tabular-nums lg:table-cell">{fmtNum(t.followers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
