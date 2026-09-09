"use client";

import { useEffect, useRef, useState } from "react";
import { fmtNum } from "@/lib/format";

const EXPLORER = (process.env.NEXT_PUBLIC_EXPLORER_URL || "https://robinhoodchain.blockscout.com").replace(
  /\/$/,
  "",
);
const PEA_CA = process.env.NEXT_PUBLIC_PEA_TOKEN || "0xd046a0B73dBE5b4E00F507526C35E5426C873f99";
// Where burned tokens live. Standard burn sinks, override with a comma list.
const BURN_ADDRS = (
  process.env.NEXT_PUBLIC_PEA_BURN_ADDRESSES ||
  "0x000000000000000000000000000000000000dEaD,0x0000000000000000000000000000000000000000"
)
  .split(",")
  .map((a) => a.trim())
  .filter(Boolean);
// Optional floor (human units) so a known burn still shows if a read fails.
const BURN_MIN = Number(process.env.NEXT_PUBLIC_PEA_BURN_MIN ?? 0);

function useCountUp(target: number, ms = 1400) {
  const [v, setV] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (!(target > 0)) return;
    let raf = 0;
    const tick = (t: number) => {
      if (start.current == null) start.current = t;
      const p = Math.min(1, (t - start.current) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** Live $PEA burn tracker: reads tokens held at the burn address(es) on-chain
 *  via the explorer and shows the cumulative amount removed from supply. */
export default function BurnTracker() {
  const [burned, setBurned] = useState<number | null>(null);
  const [supply, setSupply] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const decimalsOf = (j: any) => Number(j?.token?.decimals ?? j?.decimals ?? 18);

    const balanceAt = async (addr: string, decimals: number): Promise<number> => {
      // Try v2 token-balances, then the tokens list; find the PEA entry.
      for (const path of [
        `/api/v2/addresses/${addr}/token-balances`,
        `/api/v2/addresses/${addr}/tokens?type=ERC-20`,
      ]) {
        try {
          const res = await fetch(`${EXPLORER}${path}`, { headers: { accept: "application/json" } });
          if (!res.ok) continue;
          const data = await res.json();
          const items: any[] = Array.isArray(data) ? data : data.items ?? [];
          const hit = items.find(
            (it) => (it?.token?.address ?? it?.token?.address_hash ?? "").toLowerCase() === PEA_CA.toLowerCase(),
          );
          if (hit) return Number(hit.value ?? 0) / 10 ** (Number(hit.token?.decimals ?? decimals) || decimals);
        } catch {
          /* try next */
        }
      }
      return 0;
    };

    (async () => {
      try {
        const tRes = await fetch(`${EXPLORER}/api/v2/tokens/${PEA_CA}`, { headers: { accept: "application/json" } });
        const tJson = tRes.ok ? await tRes.json() : {};
        const decimals = decimalsOf(tJson);
        const total = Number(tJson?.total_supply ?? 0) / 10 ** decimals;
        const balances = await Promise.all(BURN_ADDRS.map((a) => balanceAt(a, decimals)));
        const onchain = balances.reduce((s, x) => s + x, 0);
        if (!cancelled) {
          setSupply(total > 0 ? total : null);
          setBurned(Math.max(onchain, BURN_MIN));
        }
      } catch {
        if (!cancelled && BURN_MIN > 0) setBurned(BURN_MIN);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useCountUp(burned ?? 0);
  const pct = supply && burned ? (burned / (supply + burned)) * 100 : null;
  const explorerAddr = `${EXPLORER}/address/${BURN_ADDRS[0]}`;

  return (
    <section className="rise card relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#ff7a1a]/15 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#ff7a1a]/30 bg-[#ff7a1a]/10 text-3xl">
            🔥
          </span>
          <div>
            <div className="eyebrow flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff7a1a] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ff7a1a]" />
              </span>
              Live burn
            </div>
            <div className="mt-1 font-display text-3xl font-black tabular-nums text-white sm:text-4xl">
              {burned == null ? "—" : fmtNum(Math.round(shown))} <span className="text-brand-bright">$PEA</span>
            </div>
            <div className="mt-1 text-xs text-muted">
              Bought back &amp; burned{pct != null ? ` · ${pct.toFixed(2)}% of supply` : ""} · gone forever
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-surface-2/50 px-3 py-1.5 text-xs font-medium text-muted">
            Buy back · Burn · Repeat
          </span>
          <a
            href={explorerAddr}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2/50 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-brand/40 hover:text-white"
          >
            Proof
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17 17 7M8 7h9v9" /></svg>
          </a>
        </div>
      </div>
    </section>
  );
}
