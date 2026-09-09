"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import type { TokenSafety } from "@/lib/types";
import { fmtUsd, fmtNum } from "@/lib/format";

const RISK_STYLE: Record<string, string> = {
  low: "border-up/40 bg-up/10 text-up",
  medium: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  high: "border-down/40 bg-down/10 text-down",
};

export default function TokensPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<TokenSafety | null>(null);

  async function scan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/tokens?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const { token } = (await res.json()) as { token: TokenSafety };
      setToken(token);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar title="Token Scanner" subtitle="Safety checks before you ape in" />
      <div className="p-5">
        <form onSubmit={scan} className="mb-6 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Token symbol or contract address…"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-50"
          >
            {loading ? "Scanning…" : "Scan"}
          </button>
        </form>

        {token && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold">{token.symbol}</div>
                  <div className="text-sm text-muted">{token.name} · {token.chain}</div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${RISK_STYLE[token.risk]}`}>
                  {token.risk} risk
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-muted">Price</div>
                  <div className="font-semibold tabular-nums">{fmtUsd(token.priceUsd)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Liquidity</div>
                  <div className="font-semibold tabular-nums">{fmtUsd(token.liquidityUsd, { compact: true })}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Holders</div>
                  <div className="font-semibold tabular-nums">{fmtNum(token.holders)}</div>
                </div>
              </div>
              <div className="mt-4 break-all font-mono text-xs text-muted">{token.address}</div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="mb-3 font-semibold">Safety checks</h3>
              <ul className="space-y-2">
                {token.checks.map((c) => (
                  <li key={c.label} className="flex items-center justify-between text-sm">
                    <span>{c.label}</span>
                    <span className={c.passed ? "text-up" : "text-down"}>{c.passed ? "✓ Pass" : "✗ Fail"}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!token && (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center text-muted">
            Enter a token to run a safety scan.
          </div>
        )}
      </div>
    </>
  );
}
