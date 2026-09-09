"use client";

import { useEffect, useState } from "react";
import { fmtUsd, fmtNum } from "@/lib/format";

const EXPLORER = (process.env.NEXT_PUBLIC_EXPLORER_URL || "https://robinhoodchain.blockscout.com").replace(
  /\/$/,
  "",
);
// Official $PEA token on Robinhood Chain.
const PEA_CA = process.env.NEXT_PUBLIC_PEA_TOKEN || "0xd046a0B73dBE5b4E00F507526C35E5426C873f99";

interface PeaData {
  price?: number;
  marketCap?: number;
  holders?: number;
  supply?: number;
}

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Official $PEA token banner. Reads real-time on-chain data (price, market cap,
 * holders, 24h volume) from the Robinhood Chain explorer in the browser, polling
 * so the price stays live. The explorer request runs client-side to pass the
 * bot gate that blocks server-side calls.
 */
export default function PeaToken({
  fallbackPrice,
  fallbackMarketCap,
}: {
  fallbackPrice?: number;
  fallbackMarketCap?: number;
}) {
  const [d, setD] = useState<PeaData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${EXPLORER}/api/v2/tokens/${PEA_CA}`, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) return;
        const j = await res.json();
        const price = Number(j?.exchange_rate);
        const decimals = Number(j?.decimals ?? 18);
        const supply = Number(j?.total_supply ?? 0) / 10 ** decimals;
        const circ = Number(j?.circulating_market_cap);
        if (!cancelled) {
          setD({
            price: Number.isFinite(price) && price > 0 ? price : undefined,
            marketCap: circ > 0 ? circ : undefined,
            holders: Number(j?.holders) || Number(j?.holders_count) || undefined,
            supply: supply > 0 ? supply : undefined,
          });
        }
      } catch {
        /* explorer gated / offline: card still shows holders/supply when available */
      }
    };
    load();
    const id = setInterval(load, 25000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Price: explorer exchange_rate first, then the fomo board fallback.
  const price = d?.price ?? fallbackPrice;
  // Market cap: explorer circulating cap, else price x supply, else fomo board.
  const marketCap =
    d?.marketCap ??
    (price != null && d?.supply != null ? price * d.supply : undefined) ??
    fallbackMarketCap;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PEA_CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="rise card relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
      <div className="relative flex flex-col gap-5">
        {/* Identity + live price */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border ring-1 ring-brand/25 shadow-glow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pea-logo.jpg" alt="PEA" className="h-full w-full object-cover" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-black tracking-tight">$PEA</span>
                <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-bright">
                  Official
                </span>
              </div>
              <div className="text-xs text-muted">Pea · Robinhood Chain</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
              </span>
              <span className="eyebrow !tracking-[0.14em]">Live price</span>
            </div>
            <div className="mt-1 font-display text-3xl font-black tabular-nums text-white">
              {price != null ? fmtUsd(price) : "—"}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Market cap", marketCap != null ? fmtUsd(marketCap, { compact: true }) : "—"],
            ["Holders", d?.holders != null ? fmtNum(d.holders) : "—"],
            ["Supply", d?.supply != null ? fmtNum(d.supply) : "—"],
          ].map(([label, val]) => (
            <div key={label} className="rounded-xl border border-border-soft bg-surface-2/40 p-3">
              <div className="eyebrow !tracking-[0.1em]">{label}</div>
              <div className="mt-1 font-display text-base font-bold tabular-nums">{val}</div>
            </div>
          ))}
        </div>

        {/* Contract address */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-soft bg-surface-2/40 px-3 py-2.5">
          <span className="eyebrow !tracking-[0.1em]">CA</span>
          <code className="font-mono text-xs text-muted sm:text-sm">
            <span className="sm:hidden">{short(PEA_CA)}</span>
            <span className="hidden break-all sm:inline">{PEA_CA}</span>
          </code>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={copy}
              className="rounded-lg border border-border bg-surface-3/60 px-2.5 py-1.5 text-xs font-medium text-muted transition hover:border-brand/40 hover:text-white"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={`${EXPLORER}/token/${PEA_CA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-3/60 px-2.5 py-1.5 text-xs font-medium text-muted transition hover:border-brand/40 hover:text-white"
            >
              Explorer
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17 17 7M8 7h9v9" /></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
