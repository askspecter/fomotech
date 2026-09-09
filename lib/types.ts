// Domain types the UI consumes, mapped from the fomo API (api.fomoapi.io).
// The API client (fomo-api.ts) maps raw API responses into these shapes.

export type LeaderboardWindow = "24h" | "7d" | "30d" | "all";

// Derived market summary (fomo has no single "market stats" endpoint — we
// compute these from the leaderboard window).
export interface MarketStats {
  window: LeaderboardWindow;
  totalVolumeUsd: number;
  totalPnlUsd: number;
  activeTraders: number;
  totalTrades: number;
}

// /v2/leaderboard/{window}
export interface Trader {
  rank: number;
  handle: string;
  displayName: string;
  pnlUsd: number;
  volumeUsd: number;
  trades: number;
  followers: number;
  holdings: number;
  wallets: { solana?: string; evm?: string };
  topTokens: string[];
  verified: boolean;
}

// /v2/leaderboard/tokens/{board}
export interface BoardToken {
  rank: number;
  image?: string;
  name: string;
  symbol: string;
  address: string;
  network: string;
  holders: number;
  priceUsd: number;
  change24h: number;
  marketCapUsd: number;
  volume24hUsd: number;
  fomoBuyers: number;
}

// /v2/alerts (firehose)
export type AlertType = "buy" | "sell" | "thesis" | "whale" | "price" | "trade" | "follow";

export interface Alert {
  id: string;
  alertType: AlertType | string;
  source: string; // "feed" | "push"
  trader: string | null;
  token: string | null;
  tokenAddress?: string | null;
  chainId?: number;
  chain?: string;
  usdValue: number | null;
  text: string;
  ts: number; // ms epoch
}

// /v2/tokens/search
export interface TokenSearchResult {
  symbol: string;
  address: string;
  name: string;
  image?: string;
  marketCapUsd: number;
}

// /v2/token/{address}/stats
export interface TokenWindow {
  buys: number;
  sells: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  buyVolumeUsd: number;
  sellVolumeUsd: number;
  netVolumeUsd: number;
  buySellRatio: number | null;
}

export interface TokenStats {
  holders: number;
  top10HoldersPercent: number;
  windows: Partial<Record<"5m" | "1h" | "4h" | "24h", TokenWindow>>;
}

// /token/{address}/holders
export interface TokenHolder {
  handle: string;
  amount: number;
  valueUsd: number;
  priceUsd: number;
}

// /v2/token/{address}/devs
export interface TokenDev {
  handle: string | null;
  wallet?: { solana?: string; evm?: string };
  isDev: boolean;
  amount: number;
  valueUsd: number;
  costBasisUsd: number;
  averageEntryPrice: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  thesis?: string;
}

export interface TokenIntel {
  query: string;
  found: boolean;
  meta?: TokenSearchResult;
  networkId?: number;
  stats?: TokenStats;
  holders: TokenHolder[];
  devs: TokenDev[];
}
