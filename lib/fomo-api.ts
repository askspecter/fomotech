// Pluggable fomo API client (https://api.fomoapi.io).
//
// Single seam between the UI and the data source:
// - NEXT_PUBLIC_FOMO_DATA_SOURCE !== "live"  -> built-in sample data (0 credits)
// - "live"                                   -> real fomo API with your Bearer key
//
// All live calls run server-side (server components / route handlers) so
// FOMO_API_KEY never reaches the browser.

import type {
  LeaderboardWindow,
  MarketStats,
  Trader,
  BoardToken,
  Alert,
  TokenIntel,
  TokenStats,
  TokenHolder,
  TokenDev,
  TokenSearchResult,
} from "./types";
import {
  mockLeaderboard,
  mockMarketStats,
  mockTrending,
  mockAlerts,
  mockTokenIntel,
} from "./mock";

const DATA_SOURCE = process.env.NEXT_PUBLIC_FOMO_DATA_SOURCE ?? "mock";
const BASE_URL = (process.env.FOMO_API_BASE_URL ?? "https://api.fomoapi.io").replace(/\/$/, "");
const API_KEY = process.env.FOMO_API_KEY ?? "";

export const isLive = DATA_SOURCE === "live";

/** Friendly chain name -> fomo networkId (needed for tokens outside the directory). */
export const NETWORK_IDS: Record<string, number> = {
  robinhood: 4663,
  solana: 1399811149,
  ethereum: 1,
  eth: 1,
  base: 8453,
  bsc: 56,
};

async function fomoFetch<T>(path: string, revalidate = 30): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      authorization: API_KEY ? `Bearer ${API_KEY}` : "",
      accept: "application/json",
    },
    next: { revalidate },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`fomo API ${path} -> ${res.status} ${res.statusText} ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

// --- Leaderboard ----------------------------------------------------------

export async function getLeaderboard(
  window: LeaderboardWindow = "24h",
  limit = 50,
): Promise<Trader[]> {
  if (!isLive) return mockLeaderboard(window, limit);
  const data = await fomoFetch<{ traders: any[] }>(`/v2/leaderboard/${window}?limit=${limit}`);
  return (data.traders ?? []).map((t, i) => ({
    rank: t.rank ?? i + 1,
    handle: t.handle,
    displayName: t.displayName ?? t.handle,
    pnlUsd: Number(t.pnlUsd ?? 0),
    volumeUsd: Number(t.volumeUsd ?? 0),
    trades: Number(t.trades ?? 0),
    followers: Number(t.followers ?? 0),
    holdings: Number(t.holdings ?? 0),
    wallets: { solana: t.wallets?.solana, evm: t.wallets?.evm },
    topTokens: t.topTokens ?? [],
    verified: Boolean(t.verified),
  }));
}

/** Pure: derive the dashboard summary from a leaderboard snapshot. */
export function deriveMarketStats(traders: Trader[], window: LeaderboardWindow): MarketStats {
  return {
    window,
    totalVolumeUsd: traders.reduce((s, t) => s + t.volumeUsd, 0),
    totalPnlUsd: traders.reduce((s, t) => s + t.pnlUsd, 0),
    activeTraders: traders.length,
    totalTrades: traders.reduce((s, t) => s + t.trades, 0),
  };
}

export function getMarketStats(window: LeaderboardWindow): MarketStats {
  // Mock-only convenience; live path derives from getLeaderboard.
  return mockMarketStats(window);
}

// --- Token boards ---------------------------------------------------------

export async function getTrending(limit = 10): Promise<BoardToken[]> {
  if (!isLive) return mockTrending(limit);
  const data = await fomoFetch<{ available?: boolean; tokens?: any[] }>(
    `/v2/leaderboard/tokens/trending?limit=${limit}`,
  );
  if (data.available === false || !data.tokens) return [];
  return data.tokens.map((t, i) => ({
    rank: t.rank ?? i + 1,
    image: t.image,
    name: t.token?.name ?? t.name ?? t.token?.symbol ?? "",
    symbol: t.token?.symbol ?? t.symbol ?? "",
    address: t.token?.address ?? t.address ?? "",
    network: t.network ?? "",
    holders: Number(t.holders ?? 0),
    priceUsd: Number(t.priceUsd ?? 0),
    change24h: Number(t.change24h ?? 0),
    marketCapUsd: Number(t.marketCapUsd ?? 0),
    volume24hUsd: Number(t.volume24hUsd ?? 0),
    fomoBuyers: Number(t.fomoBuyers ?? 0),
  }));
}

// --- Alerts (live feed) ---------------------------------------------------

export async function getAlerts(limit = 40): Promise<Alert[]> {
  if (!isLive) return mockAlerts(limit);
  const data = await fomoFetch<any>(`/v2/alerts?limit=${limit}`, 0);
  const items: any[] = Array.isArray(data) ? data : (data.alerts ?? data.items ?? []);
  return items.map((a, i) => ({
    id: String(a.id ?? `${a.ts ?? Date.now()}_${i}`),
    alertType: a.alertType ?? a.type ?? "trade",
    source: a.source ?? "feed",
    trader: a.trader ?? null,
    token: a.token ?? null,
    tokenAddress: a.tokenAddress ?? null,
    chainId: a.chainId,
    chain: a.chain,
    usdValue: a.usdValue ?? null,
    text: a.text ?? "",
    ts: Number(a.ts ?? Date.now()),
  }));
}

// --- Token intel (scanner) ------------------------------------------------

function looksLikeAddress(q: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(q) || (q.length >= 32 && /^[A-Za-z0-9]+$/.test(q));
}

export async function searchTokens(q: string, limit = 8): Promise<TokenSearchResult[]> {
  if (!isLive) {
    const m = mockTokenIntel(q).meta!;
    return [m];
  }
  const data = await fomoFetch<any>(`/v2/tokens/search?q=${encodeURIComponent(q)}&limit=${limit}`, 30);
  const items: any[] = Array.isArray(data) ? data : (data.results ?? data.tokens ?? []);
  return items.map((t) => ({
    symbol: t.symbol,
    address: t.address,
    name: t.name ?? t.symbol,
    image: t.image,
    marketCapUsd: Number(t.marketCapUsd ?? 0),
  }));
}

export async function getTokenIntel(query: string, networkId?: number): Promise<TokenIntel> {
  if (!isLive) return mockTokenIntel(query);

  let address = query.trim();
  let meta: TokenSearchResult | undefined;

  if (!looksLikeAddress(address)) {
    const results = await searchTokens(address, 1);
    if (!results.length) return { query, found: false, holders: [], devs: [] };
    meta = results[0];
    address = meta.address;
  }

  const net = networkId ? `?networkId=${networkId}` : "";

  const [statsR, holdersR, devsR] = await Promise.allSettled([
    fomoFetch<any>(`/v2/token/${address}/stats${net}`, 15),
    fomoFetch<any>(`/token/${address}/holders?limit=15`, 15),
    fomoFetch<any>(`/v2/token/${address}/devs${net}`, 15),
  ]);

  let stats: TokenStats | undefined;
  if (statsR.status === "fulfilled" && statsR.value) {
    const s = statsR.value;
    stats = {
      holders: Number(s.holders ?? 0),
      top10HoldersPercent: Number(s.top10HoldersPercent ?? 0),
      windows: s.windows ?? {},
    };
  }

  const holders: TokenHolder[] =
    holdersR.status === "fulfilled"
      ? (Array.isArray(holdersR.value) ? holdersR.value : holdersR.value?.holders ?? []).map((h: any) => ({
          handle: h.handle,
          amount: Number(h.amount ?? 0),
          valueUsd: Number(h.valueUsd ?? 0),
          priceUsd: Number(h.priceUsd ?? 0),
        }))
      : [];

  const devsRaw =
    devsR.status === "fulfilled"
      ? Array.isArray(devsR.value)
        ? devsR.value
        : devsR.value?.devs ?? devsR.value?.holders ?? []
      : [];
  const devs: TokenDev[] = devsRaw.map((d: any) => ({
    handle: d.handle ?? null,
    wallet: d.wallet,
    isDev: Boolean(d.isDev),
    amount: Number(d.amount ?? 0),
    valueUsd: Number(d.valueUsd ?? 0),
    costBasisUsd: Number(d.costBasisUsd ?? 0),
    averageEntryPrice: Number(d.averageEntryPrice ?? 0),
    realizedPnlUsd: Number(d.realizedPnlUsd ?? 0),
    unrealizedPnlUsd: Number(d.unrealizedPnlUsd ?? 0),
    thesis: d.thesis,
  }));

  return { query, found: true, meta, networkId, stats, holders, devs };
}
