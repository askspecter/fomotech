import type {
  MarketStats,
  TimePoint,
  TrendingToken,
  Trader,
  FeedTrade,
  TokenSafety,
} from "./types";

const CHAINS = ["Solana", "Base", "Ethereum", "BSC", "Arbitrum"];
const TOKENS = ["PEPE", "WIF", "BONK", "POPCAT", "MOG", "TURBO", "DEGEN", "BRETT"];
const HANDLES = ["cryptowhale", "degenape", "moonboy", "satoshi_jr", "alphachad", "pumpqueen", "gmfrog", "liquidsnake"];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shortAddr(): string {
  const hex = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < 4; i++) s += pick(hex.split(""));
  s += "...";
  for (let i = 0; i < 4; i++) s += pick(hex.split(""));
  return s;
}

export function mockMarketStats(): MarketStats {
  return {
    totalVolume24h: rand(8_000_000, 24_000_000),
    activeTraders24h: Math.floor(rand(12_000, 38_000)),
    totalTrades24h: Math.floor(rand(180_000, 520_000)),
    volumeChangePct: rand(-18, 32),
  };
}

export function mockVolumeSeries(points = 24): TimePoint[] {
  const out: TimePoint[] = [];
  let base = rand(400_000, 900_000);
  for (let i = points - 1; i >= 0; i--) {
    base = Math.max(50_000, base + rand(-120_000, 140_000));
    out.push({ t: `${i}h`, value: Math.round(base) });
  }
  return out.reverse();
}

export function mockTrending(n = 8): TrendingToken[] {
  return Array.from({ length: n }).map((_, i) => {
    const buys = Math.floor(rand(200, 4000));
    const sells = Math.floor(rand(150, 3800));
    return {
      symbol: TOKENS[i % TOKENS.length],
      name: `${TOKENS[i % TOKENS.length]} Token`,
      chain: pick(CHAINS),
      priceUsd: rand(0.0000001, 3),
      change24hPct: rand(-45, 120),
      volume24h: rand(200_000, 6_000_000),
      buys24h: buys,
      sells24h: sells,
      address: shortAddr(),
    };
  });
}

export function mockLeaderboard(n = 20): Trader[] {
  return Array.from({ length: n })
    .map((_, i) => ({
      rank: i + 1,
      address: shortAddr(),
      handle: HANDLES[i % HANDLES.length] + (i > 7 ? i : ""),
      pnlUsd: rand(2_000, 480_000) * (i < 3 ? 2 : 1),
      pnlPct: rand(8, 340),
      volumeUsd: rand(50_000, 4_000_000),
      winRatePct: rand(48, 92),
      followers: Math.floor(rand(120, 42_000)),
      trades: Math.floor(rand(40, 2200)),
    }))
    .sort((a, b) => b.pnlUsd - a.pnlUsd)
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

export function mockFeed(n = 30): FeedTrade[] {
  const now = Date.now();
  return Array.from({ length: n }).map((_, i) => {
    const amountUsd = rand(50, 85_000);
    return {
      id: `t_${now}_${i}`,
      time: new Date(now - i * rand(2000, 45000)).toISOString(),
      side: Math.random() > 0.48 ? "buy" : "sell",
      traderHandle: pick(HANDLES),
      traderAddress: shortAddr(),
      tokenSymbol: pick(TOKENS),
      chain: pick(CHAINS),
      amountUsd,
      isWhale: amountUsd > 25_000,
    };
  });
}

export function mockTokenSafety(query: string): TokenSafety {
  const symbol = (query || pick(TOKENS)).toUpperCase().slice(0, 8);
  const score = rand(0, 1);
  const risk = score > 0.66 ? "low" : score > 0.33 ? "medium" : "high";
  return {
    symbol,
    name: `${symbol} Token`,
    chain: pick(CHAINS),
    address: shortAddr(),
    priceUsd: rand(0.0000001, 2),
    liquidityUsd: rand(5_000, 2_500_000),
    holders: Math.floor(rand(120, 85_000)),
    risk,
    checks: [
      { label: "Liquidity locked", passed: score > 0.4 },
      { label: "Contract verified", passed: score > 0.3 },
      { label: "No mint authority", passed: score > 0.55 },
      { label: "Not a honeypot", passed: score > 0.25 },
      { label: "Ownership renounced", passed: score > 0.6 },
    ],
  };
}
