import type {
  LeaderboardWindow,
  MarketStats,
  Trader,
  BoardToken,
  Alert,
  TokenIntel,
  TokenWindow,
  TraderProfile,
  UserTrade,
  Portfolio,
  SocialTrader,
} from "./types";

const CHAINS = ["robinhood", "solana", "base", "bsc", "ethereum"];
const TOKENS = ["PONS", "PEPE", "WIF", "BONK", "POPCAT", "MOG", "TURBO", "DEGEN"];
const HANDLES = ["CryptoKaleo", "frankdegods", "ansem", "theveeman", "cosekant", "pumpqueen", "gmfrog", "alphachad"];

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function solAddr(): string {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
  return Array.from({ length: 44 }, () => pick(c.split(""))).join("");
}
function evmAddr(): string {
  const h = "0123456789abcdef";
  return "0x" + Array.from({ length: 40 }, () => pick(h.split(""))).join("");
}

export function mockLeaderboard(window: LeaderboardWindow, limit = 30): Trader[] {
  const scale = window === "24h" ? 1 : window === "7d" ? 4 : window === "30d" ? 9 : 14;
  return Array.from({ length: limit })
    .map((_, i) => ({
      rank: i + 1,
      handle: HANDLES[i % HANDLES.length] + (i >= HANDLES.length ? i : ""),
      displayName: HANDLES[i % HANDLES.length].toUpperCase(),
      pnlUsd: rand(2_000, 160_000) * scale * (i < 3 ? 1.8 : 1),
      volumeUsd: rand(40_000, 900_000) * scale,
      trades: Math.floor(rand(20, 400) * scale),
      followers: Math.floor(rand(120, 42_000)),
      holdings: Math.floor(rand(1, 18)),
      wallets: { solana: solAddr(), evm: evmAddr() },
      topTokens: [evmAddr().slice(0, 8), evmAddr().slice(0, 8)],
      verified: Math.random() > 0.5,
    }))
    .sort((a, b) => b.pnlUsd - a.pnlUsd)
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

export function mockMarketStats(window: LeaderboardWindow): MarketStats {
  const board = mockLeaderboard(window, 50);
  return {
    window,
    totalVolumeUsd: board.reduce((s, t) => s + t.volumeUsd, 0),
    totalPnlUsd: board.reduce((s, t) => s + t.pnlUsd, 0),
    activeTraders: board.length,
    totalTrades: board.reduce((s, t) => s + t.trades, 0),
  };
}

export function mockTrending(limit = 10): BoardToken[] {
  return Array.from({ length: limit }).map((_, i) => ({
    rank: i + 1,
    name: `${TOKENS[i % TOKENS.length]} Token`,
    symbol: TOKENS[i % TOKENS.length],
    address: Math.random() > 0.5 ? solAddr() : evmAddr(),
    network: pick(CHAINS),
    holders: Math.floor(rand(200, 60_000)),
    priceUsd: rand(0.0000001, 3),
    change24h: rand(-45, 140),
    marketCapUsd: rand(200_000, 80_000_000),
    volume24hUsd: rand(100_000, 9_000_000),
    fomoBuyers: Math.floor(rand(5, 900)),
  }));
}

export function mockAlerts(limit = 40): Alert[] {
  const now = Date.now();
  const types = ["buy", "sell", "buy", "sell", "thesis", "whale", "price"];
  return Array.from({ length: limit }).map((_, i) => {
    const alertType = pick(types);
    const trader = alertType === "price" ? null : pick(HANDLES);
    const token = pick(TOKENS);
    const usd =
      alertType === "thesis" || alertType === "price" ? null : rand(50, 90_000);
    const verb = alertType === "buy" ? "bought" : alertType === "sell" ? "sold" : alertType;
    return {
      id: `alrt_${now}_${i}`,
      alertType,
      source: Math.random() > 0.8 ? "push" : "feed",
      trader,
      token,
      tokenAddress: Math.random() > 0.5 ? solAddr() : evmAddr(),
      chain: pick(CHAINS),
      usdValue: usd,
      text:
        alertType === "price"
          ? `${token} is up ${Math.floor(rand(20, 120))}% in the last hour`
          : alertType === "thesis"
            ? `${trader} wrote a thesis on $${token}`
            : `${trader} ${verb} $${token}${usd ? ` ($${Math.round(usd / 1000)}K size)` : ""}`,
      ts: now - i * rand(2000, 40000),
    };
  });
}

function mockWindow(mult: number): TokenWindow {
  const buys = Math.floor(rand(10, 400) * mult);
  const sells = Math.floor(rand(8, 360) * mult);
  const buyVol = rand(5_000, 400_000) * mult;
  const sellVol = rand(4_000, 380_000) * mult;
  return {
    buys,
    sells,
    uniqueBuyers: Math.floor(buys * rand(0.4, 0.9)),
    uniqueSellers: Math.floor(sells * rand(0.4, 0.9)),
    buyVolumeUsd: buyVol,
    sellVolumeUsd: sellVol,
    netVolumeUsd: buyVol - sellVol,
    buySellRatio: sells === 0 ? null : +(buys / sells).toFixed(2),
  };
}

export function mockTokenIntel(query: string): TokenIntel {
  const symbol = (query || pick(TOKENS)).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "PONS";
  const address = Math.random() > 0.5 ? solAddr() : evmAddr();
  return {
    query,
    found: true,
    meta: {
      symbol,
      address,
      name: `${symbol} Token`,
      marketCapUsd: rand(200_000, 60_000_000),
    },
    stats: {
      holders: Math.floor(rand(300, 70_000)),
      top10HoldersPercent: rand(8, 62),
      windows: {
        "5m": mockWindow(0.1),
        "1h": mockWindow(0.4),
        "4h": mockWindow(1),
        "24h": mockWindow(3),
      },
    },
    holders: Array.from({ length: 8 }).map(() => {
      const priceUsd = rand(0.0000001, 2);
      const amount = rand(1_000, 5_000_000);
      return { handle: pick(HANDLES), amount, priceUsd, valueUsd: amount * priceUsd };
    }).sort((a, b) => b.valueUsd - a.valueUsd),
    devs: Array.from({ length: Math.random() > 0.4 ? 2 : 0 }).map(() => {
      const cost = rand(2_000, 90_000);
      return {
        handle: pick(HANDLES),
        wallet: { solana: solAddr() },
        isDev: true,
        amount: rand(10_000, 9_000_000),
        valueUsd: rand(1_000, 120_000),
        costBasisUsd: cost,
        averageEntryPrice: rand(0.0000001, 1),
        realizedPnlUsd: rand(-20_000, 60_000),
        unrealizedPnlUsd: rand(-30_000, 80_000),
        thesis: "Early dev position. Watching liquidity.",
      };
    }),
  };
}

// --- Trader profile / trades / portfolio / following --------------------------

function cleanHandle(h: string): string {
  return (h || pick(HANDLES)).replace(/^@/, "") || pick(HANDLES);
}

export function mockTraderProfile(handle: string): TraderProfile {
  const h = cleanHandle(handle);
  const all = rand(20_000, 480_000);
  return {
    handle: h,
    displayName: h.toUpperCase(),
    found: true,
    pnlUsd: all,
    pnl: {
      "24h": rand(-8_000, 30_000),
      "7d": rand(-20_000, 90_000),
      "30d": rand(10_000, 200_000),
      all,
    },
    volumeUsd: rand(80_000, 3_000_000),
    trades: Math.floor(rand(40, 900)),
    followers: Math.floor(rand(200, 42_000)),
    following: Math.floor(rand(20, 400)),
    holdings: Math.floor(rand(2, 16)),
    wallets: { solana: solAddr(), evm: evmAddr() },
    description: "Trader on fomo. Momentum and memecoins.",
    accountAgeDays: Math.floor(rand(30, 400)),
    averageHoldTimeSeconds: Math.floor(rand(600, 120_000)),
    verified: Math.random() > 0.4,
    topTokens: [pick(TOKENS), pick(TOKENS)],
  };
}

export function mockUserTrades(handle: string, n = 20): UserTrade[] {
  const now = Date.now();
  return Array.from({ length: n }).map((_, i) => {
    const open = Math.random() > 0.5;
    const entry = rand(0.0000001, 2);
    const exit = entry * rand(0.3, 4);
    const amount = rand(1_000, 4_000_000);
    return {
      tradeId: `tr_${now}_${i}`,
      tokenSymbol: pick(TOKENS),
      tokenAddress: Math.random() > 0.5 ? solAddr() : evmAddr(),
      status: open ? "open" : "closed",
      amount,
      avgEntryPrice: entry,
      avgExitPrice: open ? 0 : exit,
      realizedPnlUsd: open ? 0 : (exit - entry) * amount,
      unrealizedPnlUsd: open ? rand(-15_000, 40_000) : 0,
      createdAt: new Date(now - i * rand(3_600_000, 86_400_000)).toISOString(),
      closedAt: open ? null : new Date(now - i * rand(600_000, 3_600_000)).toISOString(),
    };
  });
}

export function mockPortfolio(handle: string): Portfolio {
  const chains = ["robinhood", "solana", "base", "bsc", "ethereum"];
  const holdings = Array.from({ length: 7 }).map(() => {
    const priceUsd = rand(0.0000001, 3);
    const amount = rand(1_000, 6_000_000);
    return {
      tokenSymbol: pick(TOKENS),
      tokenAddress: Math.random() > 0.5 ? solAddr() : evmAddr(),
      chain: pick(chains),
      amount,
      priceUsd,
      valueUsd: amount * priceUsd,
      change24h: rand(-40, 120),
    };
  }).sort((a, b) => b.valueUsd - a.valueUsd);

  const byChain: Record<string, { holdings: number; valueUsd: number }> = {};
  for (const h of holdings) {
    byChain[h.chain] ??= { holdings: 0, valueUsd: 0 };
    byChain[h.chain].holdings += 1;
    byChain[h.chain].valueUsd += h.valueUsd;
  }
  return {
    totalValueUsd: holdings.reduce((s, h) => s + h.valueUsd, 0),
    byChain,
    holdings,
  };
}

export function mockFollowing(handle: string, n = 20): SocialTrader[] {
  return Array.from({ length: n }).map((_, i) => ({
    handle: HANDLES[i % HANDLES.length] + (i >= HANDLES.length ? i : ""),
    displayName: HANDLES[i % HANDLES.length].toUpperCase(),
    followers: Math.floor(rand(120, 40_000)),
    trades: Math.floor(rand(20, 800)),
    volumeUsd: rand(40_000, 2_000_000),
    pnl24h: rand(-10_000, 50_000),
    verified: Math.random() > 0.5,
  })).sort((a, b) => b.pnl24h - a.pnl24h);
}
