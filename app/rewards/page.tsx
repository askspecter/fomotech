"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Topbar from "@/components/Topbar";
import { fmtNum } from "@/lib/format";
import { explorerToken } from "@/lib/chain";
import { TIERS, MIN_ELIGIBLE, tierFor, STOCKS, stockLogo, type Stock } from "@/lib/rewards";

const CLAIM_BASE = process.env.NEXT_PUBLIC_REWARDS_CLAIM_URL || "https://x.com/peadotfamily";

function StockLogo({ ticker }: { ticker: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-3 font-display text-sm font-bold text-white">
        {ticker.slice(0, 3)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/img?url=${encodeURIComponent(stockLogo(ticker))}`}
      alt={ticker}
      width={44}
      height={44}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-11 w-11 shrink-0 rounded-xl border border-border-soft bg-white object-contain p-1"
    />
  );
}

export default function RewardsPage() {
  const { address: connected } = useAccount();
  const [input, setInput] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Stock | null>(null);

  useEffect(() => {
    if (connected && !input) setInput(connected);
  }, [connected, input]);

  async function check(e?: React.FormEvent) {
    e?.preventDefault();
    const addr = input.trim();
    if (!addr) return;
    setLoading(true);
    setError(null);
    setChecked(false);
    setPicked(null);
    try {
      const res = await fetch(`/api/holder?address=${encodeURIComponent(addr)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lookup failed");
      setBalance(Number(data.balance) || 0);
      setChecked(true);
    } catch (err) {
      setError((err as Error).message);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }

  const tier = balance != null ? tierFor(balance) : null;
  const eligible = !!tier;

  const claimHref = picked
    ? `https://x.com/intent/post?text=${encodeURIComponent(
        `Claiming my $PEA holder reward: $${picked.ticker} ${picked.name} 🫛\n\n@peadotfamily`,
      )}`
    : CLAIM_BASE;

  return (
    <>
      <Topbar title="Holder Rewards" subtitle="Hold $PEA, pick a real stock reward" wallet />
      <div className="mx-auto max-w-3xl space-y-6 p-5">
        {/* Intro */}
        <section className="card relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative">
            <div className="eyebrow">Holder rewards</div>
            <h2 className="mt-1 font-display text-2xl font-black tracking-tight">
              Hold $PEA. Pick a stock. 🫛
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              $PEA holders can claim a real tokenized stock on Robinhood Chain. Check your wallet, see your
              tier, and choose your reward. Minimum{" "}
              <span className="font-semibold text-white">{fmtNum(MIN_ELIGIBLE)} $PEA</span> to unlock.
            </p>
          </div>
        </section>

        {/* Wallet check */}
        <form onSubmit={check} className="flex flex-wrap gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Your wallet address (0x…)"
            className="inp min-w-[240px] flex-1 font-mono text-sm"
          />
          <button type="submit" className="btn-brand px-6 py-3 text-sm" disabled={loading}>
            {loading ? "Checking…" : "Check rewards"}
          </button>
        </form>

        {error && <div className="rounded-xl border border-down/30 bg-down/10 p-4 text-sm text-down">{error}</div>}

        {/* Tier ladder (always visible for context) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TIERS.slice().reverse().map((t) => {
            const active = tier?.name === t.name;
            return (
              <div
                key={t.name}
                className={`rounded-xl border p-3 text-center transition ${
                  active ? "border-brand/60 bg-brand/10" : "border-border-soft bg-surface-2/40"
                }`}
              >
                <div className={`font-display text-sm font-bold ${active ? "text-brand-bright" : "text-white"}`}>
                  {t.name}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-2">{fmtNum(t.min)}+ $PEA</div>
              </div>
            );
          })}
        </div>

        {/* Result */}
        {checked && balance != null && (
          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="eyebrow">Your balance</div>
                <div className="font-display text-2xl font-black tabular-nums">{fmtNum(balance)} $PEA</div>
              </div>
              {eligible ? (
                <span className="rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5 text-sm font-semibold text-brand-bright">
                  {tier!.name} tier · eligible ✅
                </span>
              ) : (
                <span className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium text-muted">
                  Not eligible yet
                </span>
              )}
            </div>

            {eligible ? (
              <p className="mt-2 text-sm text-muted">{tier!.blurb} Choose your stock reward below.</p>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Hold at least <span className="font-semibold text-white">{fmtNum(MIN_ELIGIBLE)} $PEA</span> to
                unlock rewards. You&apos;re {fmtNum(Math.max(0, MIN_ELIGIBLE - balance))} $PEA away.
              </p>
            )}
          </section>
        )}

        {/* Stock reward grid */}
        {checked && eligible && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow">Pick your reward</div>
                <h3 className="mt-1 font-display text-lg font-bold">Choose a stock</h3>
              </div>
              {picked && <span className="text-sm text-muted">Selected: <span className="font-semibold text-white">${picked.ticker}</span></span>}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {STOCKS.map((s) => {
                const sel = picked?.ticker === s.ticker;
                return (
                  <button
                    key={s.ticker}
                    onClick={() => setPicked(s)}
                    className={`card-hover flex items-center gap-3 p-3 text-left ${
                      sel ? "!border-brand ring-1 ring-brand/50" : ""
                    }`}
                  >
                    <StockLogo ticker={s.ticker} />
                    <div className="min-w-0">
                      <div className="font-display text-sm font-bold">${s.ticker}</div>
                      <div className="truncate text-xs text-muted">{s.name}</div>
                    </div>
                    {sel && <span className="ml-auto text-brand-bright">✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="text-sm text-muted">
                {picked ? (
                  <>
                    You picked <span className="font-semibold text-white">${picked.ticker}</span> ·{" "}
                    <a
                      href={explorerToken(picked.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-bright hover:underline"
                    >
                      view token
                    </a>
                  </>
                ) : (
                  "Select a stock above to claim."
                )}
              </div>
              <a
                href={claimHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-brand px-5 py-2.5 text-sm ${!picked ? "pointer-events-none opacity-50" : ""}`}
              >
                Claim reward
              </a>
            </div>
            <p className="text-center text-xs text-muted-2">
              Rewards are reviewed and distributed by the PEA team. Claiming posts your pick and tags
              @peadotfamily.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
