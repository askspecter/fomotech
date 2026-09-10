// Holder reward config. Tune thresholds and the stock list freely.

export interface Tier {
  name: string;
  min: number; // minimum $PEA held (whole tokens)
  blurb: string;
}

// Highest first. `tierFor` returns the best tier a balance qualifies for.
export const TIERS: Tier[] = [
  { name: "Diamond", min: 50_000_000, blurb: "Top holder. Pick any stock reward." },
  { name: "Gold", min: 20_000_000, blurb: "Big backer. Premium stock rewards unlocked." },
  { name: "Silver", min: 5_000_000, blurb: "Strong hands. Stock rewards unlocked." },
  { name: "Bronze", min: 1_000_000, blurb: "Welcome aboard. Stock rewards unlocked." },
];

export const MIN_ELIGIBLE = TIERS[TIERS.length - 1].min;

export function tierFor(balance: number): Tier | null {
  return TIERS.find((t) => balance >= t.min) ?? null;
}

export interface Stock {
  ticker: string;
  name: string;
  address: `0x${string}`;
}

// RWA stock tokens on Robinhood Chain (from the PONS v2 quote registry).
export const STOCKS: Stock[] = [
  { ticker: "TSLA", name: "Tesla", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d" },
  { ticker: "NVDA", name: "NVIDIA", address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC" },
  { ticker: "AAPL", name: "Apple", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9" },
  { ticker: "GOOGL", name: "Alphabet", address: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3" },
  { ticker: "AMZN", name: "Amazon", address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54" },
  { ticker: "META", name: "Meta Platforms", address: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35" },
  { ticker: "MSFT", name: "Microsoft", address: "0xe93237C50D904957Cf27E7B1133b510C669c2e74" },
  { ticker: "COIN", name: "Coinbase", address: "0x6330D8C3178a418788dF01a47479c0ce7CCF450b" },
  { ticker: "SPY", name: "S&P 500 ETF", address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C" },
  { ticker: "GME", name: "GameStop", address: "0x1b0E319c6A659F002271B69dB8A7df2F911c153E" },
  { ticker: "AMD", name: "Advanced Micro Devices", address: "0x86923f96303D656E4aa86D9d42D1e57ad2023fdC" },
  { ticker: "PLTR", name: "Palantir", address: "0x894e1ec2d74ffe5aef8dc8a9e84686accb964f2a" },
  { ticker: "SPCX", name: "SpaceX", address: "0x4a0E65A3EcceC6dBe60AE065F2e7bb85Fae35eEa" },
];

/** Real stock logo (company brand image). */
export function stockLogo(ticker: string): string {
  return `https://financialmodelingprep.com/image-stock/${ticker}.png`;
}
