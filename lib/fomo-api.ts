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
import type { TraderProfile, UserTrade, Portfolio, SocialTrader } from "./types";
import {
  mockLeaderboard,
  mockMarketStats,
  mockTrending,
  mockAlerts,
  mockTokenIntel,
  mockTraderProfile,
  mockUserTrades,
  mockPortfolio,
  mockFollowing,
} from "./mock";

const DATA_SOURCE = process.env.NEXT_PUBLIC_FOMO_DATA_SOURCE ?? "mock";
const BASE_URL = (process.env.FOMO_API_BASE_URL ?? "https://api.fomoapi.io").replace(/\/$/, "");
const API_KEY = process.env.FOMO_API_KEY ?? "";

export const isLive = DATA_SOURCE === "live";

// This app is Robinhood Chain only. Everything token-facing (feed, trending,
// token intel, portfolios) is filtered to this single chain.
export const ROBINHOOD_CHAIN = "robinhood";
export const ROBINHOOD_NETWORK_ID = 4663;

/** True when a chain name or id refers to Robinhood Chain. */
export function isRobinhood(chain?: string | number | null): boolean {
  if (chain == null) return false;
  if (typeof chain === "number") return chain === ROBINHOOD_NETWORK_ID;
  const c = chain.toLowerCase();
  return c === "robinhood" || c === "rh" || c === "hood" || c === String(ROBINHOOD_NETWORK_ID);
}

/** Friendly chain name -> fomo networkId. Robinhood Chain only. */
export const NETWORK_IDS: Record<string, number> = {
  robinhood: ROBINHOOD_NETWORK_ID,
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
  const traders: Trader[] = (data.traders ?? []).map((t, i) => ({
    rank: t.rank ?? i + 1,
    handle: t.handle,
    displayName: t.displayName ?? t.handle,
    // The leaderboard usually omits an avatar; map it defensively in case the
    // live response includes one (free), else it is resolved below / falls back
    // to a generated identicon in the UI.
    image: t.profilePictureLink ?? t.image ?? t.pfp ?? t.avatar ?? undefined,
    pnlUsd: Number(t.pnlUsd ?? 0),
    volumeUsd: Number(t.volumeUsd ?? 0),
    trades: Number(t.trades ?? 0),
    followers: Number(t.followers ?? 0),
    holdings: Number(t.holdings ?? 0),
    wallets: { solana: t.wallets?.solana, evm: t.wallets?.evm },
    topTokens: t.topTokens ?? [],
    verified: Boolean(t.verified),
  }));

  // Opt-in: resolve real profile pictures for the top N traders via
  // /v2/users/{handle} (10 credits each, cached 1h). Off by default to protect
  // the credit budget — set FOMO_AVATAR_RESOLVE_COUNT to enable.
  const resolveCount = Math.max(0, Number(process.env.FOMO_AVATAR_RESOLVE_COUNT ?? 0));
  if (resolveCount > 0) {
    await Promise.all(
      traders.slice(0, resolveCount).map(async (t) => {
        if (t.image) return;
        const url = await resolveAvatar(t.handle);
        if (url) t.image = url;
      }),
    );
  }

  return traders;
}

/** Resolve a single trader's profile picture (10 credits, cached 1h). */
async function resolveAvatar(handle: string): Promise<string | undefined> {
  try {
    const u = await fomoFetch<any>(`/v2/users/${encodeURIComponent(stripAt(handle))}`, 3600);
    return u.profilePictureLink ?? u.image ?? undefined;
  } catch {
    return undefined;
  }
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
  try {
    const data = await fomoFetch<{ available?: boolean; tokens?: any[] }>(
      `/v2/leaderboard/tokens/trending?limit=${limit}`,
      15, // keep the board price as fresh as the API allows
    );
    if (data.available === false || !data.tokens) return [];
    return data.tokens
      .filter((t: any) => isRobinhood(t.network))
      .map((t: any, i: number) => ({
        rank: t.rank ?? i + 1,
        // Real token logo from fomo (falls back to a few common alias keys).
        image: t.image ?? t.token?.image ?? t.token?.logo ?? t.logo ?? t.icon,
        name: t.token?.name ?? t.name ?? t.token?.symbol ?? "",
        symbol: t.token?.symbol ?? t.symbol ?? "",
        address: t.token?.address ?? t.address ?? "",
        network: t.network ?? ROBINHOOD_CHAIN,
        holders: Number(t.holders ?? 0),
        priceUsd: Number(t.priceUsd ?? t.token?.priceUsd ?? 0),
        change24h: Number(t.change24h ?? 0),
        marketCapUsd: Number(t.marketCapUsd ?? t.token?.marketCapUsd ?? 0),
        volume24hUsd: Number(t.volume24hUsd ?? 0),
        fomoBuyers: Number(t.fomoBuyers ?? 0),
      }));
  } catch {
    // A failed/unauthorized trending call should not crash the dashboard —
    // the board renders its "not available" state instead.
    return [];
  }
}

// --- Alerts (live feed) ---------------------------------------------------

export async function getAlerts(limit = 40): Promise<Alert[]> {
  if (!isLive) return mockAlerts(limit);
  // Robinhood Chain only: ask the API for this chain, and filter defensively.
  const data = await fomoFetch<any>(`/v2/alerts?limit=${limit}&chain=${ROBINHOOD_CHAIN}`, 0);
  const raw: any[] = Array.isArray(data) ? data : (data.alerts ?? data.items ?? []);
  const items = raw.filter((a) => a.chain == null || isRobinhood(a.chain ?? a.chainId));
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

  // Robinhood Chain only: always read token stats against network 4663.
  const net = `?networkId=${networkId ?? ROBINHOOD_NETWORK_ID}`;

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

// --- Trader profile / trades / portfolio / following ------------------------

function stripAt(handle: string): string {
  return handle.trim().replace(/^@/, "");
}

export async function getTraderProfile(handle: string): Promise<TraderProfile> {
  const h = stripAt(handle);
  if (!isLive) return mockTraderProfile(h);
  try {
    const u = await fomoFetch<any>(`/v2/users/${encodeURIComponent(h)}`, 15);
    return {
      handle: u.handle ?? h,
      displayName: u.displayName ?? u.handle ?? h,
      found: true,
      pnlUsd: Number(u.pnlUsd ?? 0),
      pnl: {
        "24h": Number(u.pnl?.["24h"] ?? 0),
        "7d": Number(u.pnl?.["7d"] ?? 0),
        "30d": Number(u.pnl?.["30d"] ?? 0),
        all: Number(u.pnl?.all ?? u.pnlUsd ?? 0),
      },
      volumeUsd: Number(u.volumeUsd ?? u.totalVolume ?? 0),
      trades: Number(u.trades ?? u.numTrades ?? 0),
      followers: Number(u.followers ?? 0),
      following: Number(u.following ?? 0),
      holdings: Number(u.holdings ?? 0),
      wallets: { solana: u.wallets?.solana, evm: u.wallets?.evm },
      profilePictureLink: u.profilePictureLink,
      description: u.description,
      accountAgeDays: u.accountAgeDays,
      averageHoldTimeSeconds: u.averageHoldTimeSeconds,
      verified: Boolean(u.verified),
      topTokens: u.topTokens ?? [],
    };
  } catch {
    return { ...mockTraderProfile(h), found: false };
  }
}

export async function getUserTrades(handle: string, limit = 25): Promise<UserTrade[]> {
  const h = stripAt(handle);
  if (!isLive) return mockUserTrades(h, limit);
  const data = await fomoFetch<any>(`/v2/users/${encodeURIComponent(h)}/trades?limit=${limit}`, 15);
  if (data?.available === false) return [];
  const items: any[] = Array.isArray(data) ? data : (data.trades ?? data.items ?? []);
  return items.map((t, i) => ({
    tradeId: String(t.tradeId ?? i),
    tokenSymbol: t.token?.symbol ?? t.tokenSymbol ?? "",
    tokenAddress: t.token?.address ?? t.tokenAddress,
    status: t.status ?? "closed",
    amount: Number(t.amount ?? 0),
    avgEntryPrice: Number(t.avgEntryPrice ?? 0),
    avgExitPrice: Number(t.avgExitPrice ?? 0),
    realizedPnlUsd: Number(t.realizedPnlUsd ?? 0),
    unrealizedPnlUsd: Number(t.unrealizedPnlUsd ?? 0),
    createdAt: t.createdAt,
    closedAt: t.closedAt ?? null,
  }));
}

export async function getUserBalances(handle: string): Promise<Portfolio> {
  const h = stripAt(handle);
  if (!isLive) return mockPortfolio(h);
  // Robinhood Chain only: narrow to this chain, and filter defensively.
  const data = await fomoFetch<any>(`/v2/users/${encodeURIComponent(h)}/balances?chain=${ROBINHOOD_CHAIN}`, 15);
  const raw: any[] = data.holdings ?? [];
  const holdings = raw
    .filter((b) => b.chain == null || isRobinhood(b.chain ?? b.token?.networkId))
    .map((b) => ({
      tokenSymbol: b.token?.symbol ?? b.tokenSymbol ?? "",
      tokenAddress: b.token?.address ?? b.tokenAddress,
      chain: ROBINHOOD_CHAIN,
      amount: Number(b.amount ?? 0),
      priceUsd: Number(b.priceUsd ?? 0),
      valueUsd: Number(b.valueUsd ?? 0),
      change24h: Number(b.change24h ?? 0),
    }));
  const rh = (data.byChain && (data.byChain.robinhood ?? data.byChain[ROBINHOOD_NETWORK_ID])) || undefined;
  return {
    totalValueUsd: rh?.valueUsd ?? holdings.reduce((s, h) => s + h.valueUsd, 0),
    byChain: rh ? { robinhood: rh } : {},
    holdings: holdings.sort((a, b) => b.valueUsd - a.valueUsd),
  };
}

export async function getUserFollowing(handle: string, limit = 50): Promise<SocialTrader[]> {
  const h = stripAt(handle);
  if (!isLive) return mockFollowing(h, limit);
  const data = await fomoFetch<any>(`/v2/users/${encodeURIComponent(h)}/following?limit=${limit}`, 30);
  const items: any[] = Array.isArray(data) ? data : (data.following ?? data.items ?? []);
  return items.map((t) => ({
    handle: t.handle,
    displayName: t.displayName ?? t.handle,
    followers: Number(t.followers ?? 0),
    trades: Number(t.trades ?? 0),
    volumeUsd: Number(t.volumeUsd ?? 0),
    pnl24h: Number(t.pnl24h ?? 0),
    verified: Boolean(t.verified),
  }));
}
