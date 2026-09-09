"use client";

import { useRef, useState } from "react";
import Topbar from "@/components/Topbar";
import Verified from "@/components/Verified";
import type { TraderProfile } from "@/lib/types";
import { fmtUsd, fmtNum, fmtPct } from "@/lib/format";

function proxied(url?: string) {
  return url ? `/api/img?url=${encodeURIComponent(url)}` : "";
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const c = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-white";
  return (
    <div className="rounded-xl border border-border-soft bg-surface-2/50 p-3">
      <div className="eyebrow !tracking-[0.1em]">{label}</div>
      <div className={`mt-1 font-display text-lg font-bold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}

export default function CardPage() {
  const [input, setInput] = useState("");
  const [p, setP] = useState<TraderProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    const h = input.trim().replace(/^@/, "");
    if (!h) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trader?handle=${encodeURIComponent(h)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.profile?.found) throw new Error("Trader not found on fomo");
      setP(data.profile as TraderProfile);
    } catch (err) {
      setError((err as Error).message);
      setP(null);
    } finally {
      setLoading(false);
    }
  }

  async function download() {
    if (!cardRef.current || !p) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, skipFonts: false });
      const a = document.createElement("a");
      a.download = `pea-card-${p.handle}.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      setError("Could not export the image. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Topbar title="Trader Card" subtitle="Generate a shareable stats card for any fomo trader" />
      <div className="mx-auto max-w-2xl space-y-6 p-5">
        <form onSubmit={generate} className="flex flex-wrap gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a fomo handle, e.g. cosekant"
            className="inp min-w-[220px] flex-1"
          />
          <button type="submit" className="btn-brand px-6 py-3 text-sm" disabled={loading}>
            {loading ? "Loading…" : "Generate"}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-down/30 bg-down/10 p-4 text-sm text-down">{error}</div>
        )}

        {!p && !error && (
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted">
            Type a trader&apos;s handle to build a card you can screenshot or download and post.
          </div>
        )}

        {p && (
          <div className="space-y-4">
            {/* The exportable card */}
            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-2xl border border-border p-6"
              style={{
                background:
                  "radial-gradient(700px 360px at 88% -10%, rgba(91,124,255,0.28), transparent 60%), linear-gradient(160deg,#0d1224 0%,#0a0d1a 60%,#070912 100%)",
              }}
            >
              <div className="pointer-events-none absolute -right-10 top-2 h-40 w-40 rounded-full bg-brand/20 blur-3xl" />

              {/* header: brand + site */}
              <div className="relative mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/pea-logo.jpg" alt="PEA" className="h-7 w-7 rounded-lg border border-border" />
                  <span className="font-display text-sm font-black tracking-tight">PEA</span>
                </div>
                <span className="text-xs font-medium text-muted-2">pea.family</span>
              </div>

              {/* identity */}
              <div className="relative flex items-center gap-4">
                {p.profilePictureLink ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={proxied(p.profilePictureLink)}
                    alt={p.handle}
                    className="h-16 w-16 rounded-full border border-border-soft object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-brand/20 font-display text-xl font-black text-brand-bright">
                    {p.handle.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-display text-xl font-black">
                    @{p.handle}
                    {p.verified && <Verified className="text-brand-bright" />}
                  </div>
                  {p.displayName && p.displayName !== p.handle && (
                    <div className="text-sm text-muted">{p.displayName}</div>
                  )}
                  {p.followers > 0 && (
                    <div className="mt-0.5 text-xs text-muted-2">{fmtNum(p.followers)} followers</div>
                  )}
                </div>
              </div>

              {/* headline PnL */}
              <div className="relative mt-5">
                <div className="eyebrow">All-time realized PnL</div>
                <div
                  className={`font-display text-4xl font-black tabular-nums ${p.pnl.all >= 0 ? "text-up" : "text-down"}`}
                >
                  {p.pnl.all >= 0 ? "+" : ""}
                  {fmtUsd(p.pnl.all, { compact: true })}
                </div>
              </div>

              {/* stat grid */}
              <div className="relative mt-4 grid grid-cols-3 gap-2.5">
                <Stat label="PnL 24h" value={fmtUsd(p.pnl["24h"], { compact: true })} tone={p.pnl["24h"] >= 0 ? "up" : "down"} />
                <Stat label="PnL 7d" value={fmtUsd(p.pnl["7d"], { compact: true })} tone={p.pnl["7d"] >= 0 ? "up" : "down"} />
                <Stat label="PnL 30d" value={fmtUsd(p.pnl["30d"], { compact: true })} tone={p.pnl["30d"] >= 0 ? "up" : "down"} />
                <Stat label="Volume" value={fmtUsd(p.volumeUsd, { compact: true })} />
                <Stat label="Trades" value={fmtNum(p.trades)} />
                <Stat label="Holdings" value={fmtNum(p.holdings)} />
              </div>

              {p.topTokens?.length > 0 && (
                <div className="relative mt-4">
                  <div className="eyebrow mb-1.5">Top tokens</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.topTokens.slice(0, 5).map((t) => (
                      <span key={t} className="rounded-md border border-border-soft bg-surface-2/60 px-2 py-1 text-xs font-medium">
                        {t.startsWith("0x") ? `${t.slice(0, 6)}…` : `$${t}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative mt-5 flex items-center justify-between border-t border-border-soft pt-3 text-xs text-muted-2">
                <span>Robinhood Chain</span>
                <span>@peadotfamily</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={download} className="btn-brand px-5 py-2.5 text-sm" disabled={downloading}>
                {downloading ? "Rendering…" : "Download PNG"}
              </button>
              <button
                onClick={() => {
                  setP(null);
                  setInput("");
                }}
                className="rounded-xl border border-border bg-surface-2/60 px-5 py-2.5 text-sm font-semibold text-muted transition hover:text-white"
              >
                New card
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
