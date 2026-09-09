"use client";

import { useEffect, useState } from "react";
import { fmtUsd } from "@/lib/format";

const EXPLORER = (process.env.NEXT_PUBLIC_EXPLORER_URL || "https://robinhoodchain.blockscout.com").replace(
  /\/$/,
  "",
);

/**
 * Token USD price. The fomo board price (`fallbackUsd`) is rendered immediately
 * (server value); then, in the browser, we ask the Robinhood Chain explorer
 * (Blockscout) for the token's on-chain `exchange_rate` and prefer it when
 * available. Running client-side lets the request pass the explorer's bot gate
 * that blocks server-side calls; any failure silently keeps the fomo price.
 */
export default function TokenPrice({ address, fallbackUsd }: { address?: string; fallbackUsd: number }) {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${EXPLORER}/api/v2/tokens/${address}`, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        const rate = Number(data?.exchange_rate);
        if (!cancelled && Number.isFinite(rate) && rate > 0) setPrice(rate);
      } catch {
        /* explorer unreachable / gated / no CORS — keep the fomo board price */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return <span className="tabular-nums">{fmtUsd(price ?? fallbackUsd)}</span>;
}
