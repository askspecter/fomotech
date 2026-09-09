import { createPublicClient, http, formatUnits, type Address } from "viem";
import { robinhoodChain } from "./chain";
import { PEA_TOKEN } from "./burn";
import { cached } from "./kv";

// PEA's PONS v2 bonding curve (used only before graduation). After graduation
// the live market is a DEX pool, read from DexScreener below.
const CURVE = (process.env.NEXT_PUBLIC_PEA_CURVE ||
  "0x576bd13cc4053Eb91D284302a348769D91a7f068") as Address;

const CURVE_ABI = [
  { name: "quoteReserve", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "tokenReserve", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "graduated", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
] as const;
const ERC20 = [
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

export interface PeaPrice {
  priceUsd: number | null;
  marketCap: number | null;
  change24h: number | null;
  volume24h: number | null;
  liquidityUsd: number | null;
  source: "dex" | "curve" | null;
}

const EMPTY: PeaPrice = {
  priceUsd: null,
  marketCap: null,
  change24h: null,
  volume24h: null,
  liquidityUsd: null,
  source: null,
};

/** Live market from the graduated DEX pool via DexScreener (keyless). Picks the
 *  deepest-liquidity pair for the token. */
async function fromDex(): Promise<PeaPrice | null> {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${PEA_TOKEN}`, {
      next: { revalidate: 20 },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const pairs: any[] = (j?.pairs ?? []).filter(
      (p: any) => (p?.baseToken?.address ?? "").toLowerCase() === PEA_TOKEN.toLowerCase(),
    );
    if (!pairs.length) return null;
    pairs.sort((a, b) => Number(b?.liquidity?.usd ?? 0) - Number(a?.liquidity?.usd ?? 0));
    const p = pairs[0];
    const priceUsd = Number(p?.priceUsd);
    if (!(priceUsd > 0)) return null;
    return {
      priceUsd,
      marketCap: Number(p?.marketCap ?? p?.fdv) || null,
      change24h: typeof p?.priceChange?.h24 === "number" ? p.priceChange.h24 : null,
      volume24h: Number(p?.volume?.h24) || null,
      liquidityUsd: Number(p?.liquidity?.usd) || null,
      source: "dex",
    };
  } catch {
    return null;
  }
}

/** Fallback: marginal price from the PONS bonding curve (pre-graduation only). */
async function fromCurve(): Promise<PeaPrice | null> {
  try {
    const client = createPublicClient({ chain: robinhoodChain, transport: http() });
    const [q, t, dec, sup] = await Promise.all([
      client.readContract({ address: CURVE, abi: CURVE_ABI, functionName: "quoteReserve" }),
      client.readContract({ address: CURVE, abi: CURVE_ABI, functionName: "tokenReserve" }),
      client.readContract({ address: PEA_TOKEN, abi: ERC20, functionName: "decimals" }),
      client.readContract({ address: PEA_TOKEN, abi: ERC20, functionName: "totalSupply" }),
    ]);
    const d = Number(dec) || 18;
    const token = Number(formatUnits(t as bigint, d));
    if (!(token > 0)) return null; // graduated / empty curve
    const quote = Number(formatUnits(q as bigint, 18));
    const ethUsd = await getEthUsd();
    const priceUsd = (quote / token) * ethUsd;
    if (!(priceUsd > 0)) return null;
    const supply = Number(formatUnits(sup as bigint, d));
    return { priceUsd, marketCap: priceUsd * supply, change24h: null, volume24h: null, liquidityUsd: null, source: "curve" };
  } catch {
    return null;
  }
}

async function getEthUsd(): Promise<number> {
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd", {
      next: { revalidate: 60 },
    });
    if (!r.ok) return 0;
    const j = await r.json();
    return Number(j?.ethereum?.usd) || 0;
  } catch {
    return 0;
  }
}

/** Live $PEA market: DEX pool first (post-graduation), bonding curve as fallback.
 *  Cached centrally so all visitors share one lookup per short window. */
export async function getPeaPrice(): Promise<PeaPrice> {
  return cached("pea:price", 15, async () => (await fromDex()) ?? (await fromCurve()) ?? EMPTY);
}
