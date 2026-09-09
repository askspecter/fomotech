"use client";

import { useEffect, useRef, useState } from "react";
import { fmtNum, fmtUsd } from "@/lib/format";

const EXPLORER = (process.env.NEXT_PUBLIC_EXPLORER_URL || "https://robinhoodchain.blockscout.com").replace(
  /\/$/,
  "",
);
const BURN_ADDR = (process.env.NEXT_PUBLIC_PEA_BURN_ADDRESSES || "0x000000000000000000000000000000000000dEaD")
  .split(",")[0]
  .trim();

function useCountUp(target: number, ms = 1400) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (!(target > 0)) return;
    const base = from.current;
    start.current = null;
    let raf = 0;
    const tick = (t: number) => {
      if (start.current == null) start.current = t;
      const p = Math.min(1, (t - start.current) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(base + (target - base) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** Live $PEA burn tracker. The amount removed from supply is read on-chain via
 *  the server (/api/burn) so it is always accurate; it refreshes on an interval
 *  and animates. SSR values give an instant first paint. */
export default function BurnTracker({
  initialBurned,
  initialSupply,
  initialPrice,
}: {
  initialBurned?: number | null;
  initialSupply?: number | null;
  initialPrice?: number | null;
}) {
  const [burned, setBurned] = useState<number | null>(initialBurned ?? null);
  const [supply, setSupply] = useState<number | null>(initialSupply ?? null);
  const [price, setPrice] = useState<number | null>(initialPrice ?? null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [burnRes, priceRes] = await Promise.all([
          fetch("/api/burn", { cache: "no-store" }),
          fetch("/api/pea-price", { cache: "no-store" }),
        ]);
        if (burnRes.ok) {
          const j = await burnRes.json();
          if (!cancelled) {
            if (typeof j.burned === "number") setBurned(j.burned);
            if (typeof j.supply === "number") setSupply(j.supply);
          }
        }
        if (priceRes.ok) {
          const p = await priceRes.json();
          if (!cancelled && typeof p.priceUsd === "number") setPrice(p.priceUsd);
        }
      } catch {
        /* keep last value */
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const burnedUsd = burned != null && price != null ? burned * price : null;

  const shown = useCountUp(burned ?? 0);
  const pct = supply && burned ? (burned / supply) * 100 : null;
  const explorerAddr = `${EXPLORER}/address/${BURN_ADDR}`;

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
              {burnedUsd != null && (
                <span className="ml-2 align-middle text-base font-bold text-[#ff7a1a]">
                  ≈ {fmtUsd(burnedUsd, { compact: true })}
                </span>
              )}
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
