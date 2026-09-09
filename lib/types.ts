// Shared domain types for the fomo companion platform.
// These describe the shape the UI consumes. The API client (fomo-api.ts)
// is responsible for mapping whatever the real fomo API returns into these.

export interface MarketStats {
  totalVolume24h: number;
  activeTraders24h: number;
  totalTrades24h: number;
  volumeChangePct: number; // vs previous 24h
}

export interface TimePoint {
  t: string; // ISO timestamp or label
  value: number;
}

export interface TrendingToken {
  symbol: string;
  name: string;
  chain: string;
  priceUsd: number;
  change24hPct: number;
  volume24h: number;
  buys24h: number;
  sells24h: number;
  address?: string;
}

export interface Trader {
  rank: number;
  address: string;
  handle?: string;
  avatarUrl?: string;
  pnlUsd: number;
  pnlPct: number;
  volumeUsd: number;
  winRatePct: number;
  followers: number;
  trades: number;
}

export type TradeSide = "buy" | "sell";

export interface FeedTrade {
  id: string;
  time: string; // ISO
  side: TradeSide;
  traderHandle?: string;
  traderAddress: string;
  tokenSymbol: string;
  chain: string;
  amountUsd: number;
  isWhale: boolean;
}

export type RiskLevel = "low" | "medium" | "high";

export interface TokenSafety {
  symbol: string;
  name: string;
  chain: string;
  address: string;
  priceUsd: number;
  liquidityUsd: number;
  holders: number;
  risk: RiskLevel;
  checks: { label: string; passed: boolean }[];
}
