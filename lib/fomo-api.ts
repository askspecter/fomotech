// Pluggable fomo API client.
//
// This module is the single seam between the UI and the data source.
// - When NEXT_PUBLIC_FOMO_DATA_SOURCE !== "live", every function returns
//   built-in sample data so the whole app runs with zero configuration.
// - When set to "live", each function calls the real fomo API. You only
//   need to fill in the endpoint paths + response mapping in the marked
//   spots once you share the API's shape.
//
// All live calls are meant to run server-side (route handlers / server
// components) so FOMO_API_KEY is never shipped to the browser.

import type {
  MarketStats,
  TimePoint,
  TrendingToken,
  Trader,
  FeedTrade,
  TokenSafety,
} from "./types";
import {
  mockMarketStats,
  mockVolumeSeries,
  mockTrending,
  mockLeaderboard,
  mockFeed,
  mockTokenSafety,
} from "./mock";

const DATA_SOURCE = process.env.NEXT_PUBLIC_FOMO_DATA_SOURCE ?? "mock";
const BASE_URL = process.env.FOMO_API_BASE_URL ?? "";
const API_KEY = process.env.FOMO_API_KEY ?? "";

export const isLive = DATA_SOURCE === "live";

/**
 * Thin fetch wrapper for the fomo API. Adjust headers/auth to match what
 * your API expects (Bearer token, x-api-key, etc.).
 */
async function fomoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) throw new Error("FOMO_API_BASE_URL is not set");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      // TODO: match your API's auth scheme:
      Authorization: API_KEY ? `Bearer ${API_KEY}` : "",
      // "x-api-key": API_KEY,
      ...(init?.headers ?? {}),
    },
    // Revalidate every 15s for near-real-time data; tune per endpoint.
    next: { revalidate: 15 },
  });
  if (!res.ok) {
    throw new Error(`fomo API ${path} -> ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Each getter: live branch (fill in path + mapping) OR mock fallback.
// ---------------------------------------------------------------------------

export async function getMarketStats(): Promise<MarketStats> {
  if (!isLive) return mockMarketStats();
  // TODO: replace with real endpoint, e.g. "/v1/market/stats"
  const raw = await fomoFetch<any>("/market/stats");
  return {
    totalVolume24h: raw.totalVolume24h ?? 0,
    activeTraders24h: raw.activeTraders24h ?? 0,
    totalTrades24h: raw.totalTrades24h ?? 0,
    volumeChangePct: raw.volumeChangePct ?? 0,
  };
}

export async function getVolumeSeries(): Promise<TimePoint[]> {
  if (!isLive) return mockVolumeSeries();
  const raw = await fomoFetch<any[]>("/market/volume?window=24h");
  return raw.map((p) => ({ t: String(p.t ?? p.time), value: Number(p.value ?? p.volume) }));
}

export async function getTrending(): Promise<TrendingToken[]> {
  if (!isLive) return mockTrending();
  const raw = await fomoFetch<any[]>("/tokens/trending");
  return raw.map((t) => ({
    symbol: t.symbol,
    name: t.name ?? t.symbol,
    chain: t.chain,
    priceUsd: Number(t.priceUsd ?? t.price),
    change24hPct: Number(t.change24hPct ?? t.change24h),
    volume24h: Number(t.volume24h),
    buys24h: Number(t.buys24h ?? 0),
    sells24h: Number(t.sells24h ?? 0),
    address: t.address,
  }));
}

export async function getLeaderboard(): Promise<Trader[]> {
  if (!isLive) return mockLeaderboard();
  const raw = await fomoFetch<any[]>("/traders/leaderboard");
  return raw.map((t, i) => ({
    rank: t.rank ?? i + 1,
    address: t.address,
    handle: t.handle ?? t.username,
    avatarUrl: t.avatarUrl,
    pnlUsd: Number(t.pnlUsd ?? t.pnl),
    pnlPct: Number(t.pnlPct ?? 0),
    volumeUsd: Number(t.volumeUsd ?? t.volume),
    winRatePct: Number(t.winRatePct ?? t.winRate),
    followers: Number(t.followers ?? 0),
    trades: Number(t.trades ?? 0),
  }));
}

export async function getFeed(): Promise<FeedTrade[]> {
  if (!isLive) return mockFeed();
  const raw = await fomoFetch<any[]>("/feed/trades");
  return raw.map((f) => ({
    id: String(f.id),
    time: f.time ?? f.timestamp,
    side: f.side,
    traderHandle: f.traderHandle ?? f.handle,
    traderAddress: f.traderAddress ?? f.address,
    tokenSymbol: f.tokenSymbol ?? f.symbol,
    chain: f.chain,
    amountUsd: Number(f.amountUsd ?? f.amount),
    isWhale: Boolean(f.isWhale ?? Number(f.amountUsd ?? f.amount) > 25000),
  }));
}

export async function getTokenSafety(query: string): Promise<TokenSafety> {
  if (!isLive) return mockTokenSafety(query);
  const raw = await fomoFetch<any>(`/tokens/safety?q=${encodeURIComponent(query)}`);
  return {
    symbol: raw.symbol,
    name: raw.name ?? raw.symbol,
    chain: raw.chain,
    address: raw.address,
    priceUsd: Number(raw.priceUsd ?? raw.price),
    liquidityUsd: Number(raw.liquidityUsd ?? raw.liquidity),
    holders: Number(raw.holders ?? 0),
    risk: raw.risk ?? "medium",
    checks: raw.checks ?? [],
  };
}
