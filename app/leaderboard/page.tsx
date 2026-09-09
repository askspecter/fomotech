import Topbar from "@/components/Topbar";
import WindowTabs from "@/components/WindowTabs";
import Verified from "@/components/Verified";
import { getLeaderboard } from "@/lib/fomo-api";
import { fmtUsd, fmtNum } from "@/lib/format";
import type { LeaderboardWindow } from "@/lib/types";

export const dynamic = "force-dynamic";

const WINDOWS: LeaderboardWindow[] = ["24h", "7d", "30d", "all"];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { window?: string };
}) {
  const window = (WINDOWS.includes(searchParams.window as LeaderboardWindow)
    ? searchParams.window
    : "24h") as LeaderboardWindow;

  const traders = await getLeaderboard(window, 100);

  return (
    <>
      <Topbar title="Leaderboard" subtitle="Top fomo traders by realized PnL" />
      <div className="space-y-4 p-5">
        <WindowTabs active={window} />
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-4 font-medium">#</th>
                <th className="px-5 py-4 font-medium">Trader</th>
                <th className="px-5 py-4 text-right font-medium">PnL</th>
                <th className="hidden px-5 py-4 text-right font-medium md:table-cell">Volume</th>
                <th className="hidden px-5 py-4 text-right font-medium md:table-cell">Trades</th>
                <th className="hidden px-5 py-4 text-right font-medium lg:table-cell">Holdings</th>
                <th className="hidden px-5 py-4 text-right font-medium lg:table-cell">Followers</th>
              </tr>
            </thead>
            <tbody>
              {traders.map((t) => (
                <tr key={t.handle + t.rank} className="border-t border-border/60 hover:bg-surface-2/50">
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
                    <div className="flex items-center gap-1.5 font-semibold">
                      @{t.handle}
                      {t.verified && <Verified className="text-brand-bright" />}
                    </div>
                    <div className="font-mono text-xs text-muted">
                      {t.wallets.solana
                        ? `${t.wallets.solana.slice(0, 4)}…${t.wallets.solana.slice(-4)}`
                        : t.wallets.evm
                          ? `${t.wallets.evm.slice(0, 6)}…${t.wallets.evm.slice(-4)}`
                          : ""}
                    </div>
                  </td>
                  <td className={`px-5 py-4 text-right font-semibold tabular-nums ${t.pnlUsd >= 0 ? "text-up" : "text-down"}`}>
                    {fmtUsd(t.pnlUsd, { compact: true })}
                  </td>
                  <td className="hidden px-5 py-4 text-right tabular-nums md:table-cell">
                    {fmtUsd(t.volumeUsd, { compact: true })}
                  </td>
                  <td className="hidden px-5 py-4 text-right tabular-nums md:table-cell">{fmtNum(t.trades)}</td>
                  <td className="hidden px-5 py-4 text-right tabular-nums lg:table-cell">{t.holdings}</td>
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
