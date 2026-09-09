import { createPublicClient, http, formatUnits, type Address } from "viem";
import { robinhoodChain } from "./chain";
import { PEA_TOKEN } from "./burn";

// PEA's PONS v2 bonding curve (quote = native ETH). Override via env if it
// migrates or graduates to a pool.
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
  priceEth: number | null;
  ethUsd: number | null;
}

/** Live ETH/USD from CoinGecko (keyless), cached 60s by the fetch layer. */
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

/**
 * $PEA price straight from the PONS bonding curve: the marginal price is the
 * quote reserve over the token reserve (both virtual), quoted in ETH, then
 * converted to USD. Read on-chain via RPC so it never depends on an indexer.
 */
export async function getPeaPrice(): Promise<PeaPrice> {
  try {
    const client = createPublicClient({ chain: robinhoodChain, transport: http() });
    const [q, t, dec, sup, ethUsd] = await Promise.all([
      client.readContract({ address: CURVE, abi: CURVE_ABI, functionName: "quoteReserve" }),
      client.readContract({ address: CURVE, abi: CURVE_ABI, functionName: "tokenReserve" }),
      client.readContract({ address: PEA_TOKEN, abi: ERC20, functionName: "decimals" }),
      client.readContract({ address: PEA_TOKEN, abi: ERC20, functionName: "totalSupply" }),
      getEthUsd(),
    ]);
    const d = Number(dec) || 18;
    const quote = Number(formatUnits(q as bigint, 18)); // ETH, 18 decimals
    const token = Number(formatUnits(t as bigint, d));
    const priceEth = token > 0 ? quote / token : 0;
    const priceUsd = priceEth * ethUsd;
    const supply = Number(formatUnits(sup as bigint, d));
    const marketCap = priceUsd * supply;
    return {
      priceUsd: priceUsd > 0 ? priceUsd : null,
      marketCap: marketCap > 0 ? marketCap : null,
      priceEth: priceEth > 0 ? priceEth : null,
      ethUsd: ethUsd > 0 ? ethUsd : null,
    };
  } catch {
    return { priceUsd: null, marketCap: null, priceEth: null, ethUsd: null };
  }
}
