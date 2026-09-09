import { createPublicClient, http, formatUnits, type Address } from "viem";
import { robinhoodChain } from "./chain";
import { cached } from "./kv";

const ERC20 = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

export const PEA_TOKEN = (process.env.NEXT_PUBLIC_PEA_TOKEN ||
  "0xd046a0B73dBE5b4E00F507526C35E5426C873f99") as Address;

export const BURN_ADDRESSES = (
  process.env.NEXT_PUBLIC_PEA_BURN_ADDRESSES ||
  "0x000000000000000000000000000000000000dEaD,0x0000000000000000000000000000000000000000"
)
  .split(",")
  .map((a) => a.trim())
  .filter(Boolean) as Address[];

export interface BurnInfo {
  burned: number;
  supply: number;
}

/**
 * Read the amount of $PEA removed from supply directly from the chain: the sum
 * of balances held at the burn address(es). Runs on-chain via RPC (server-side)
 * so it never depends on the explorer's indexer or its bot gate.
 */
export async function getPeaBurn(): Promise<BurnInfo> {
  return cached("pea:burn", 20, fetchPeaBurn);
}

async function fetchPeaBurn(): Promise<BurnInfo> {
  const client = createPublicClient({ chain: robinhoodChain, transport: http() });
  const [decimals, supplyRaw, ...balances] = await Promise.all([
    client.readContract({ address: PEA_TOKEN, abi: ERC20, functionName: "decimals" }),
    client.readContract({ address: PEA_TOKEN, abi: ERC20, functionName: "totalSupply" }),
    ...BURN_ADDRESSES.map((a) =>
      client.readContract({ address: PEA_TOKEN, abi: ERC20, functionName: "balanceOf", args: [a] }),
    ),
  ]);
  const d = Number(decimals) || 18;
  const burned = (balances as bigint[]).reduce((sum, b) => sum + Number(formatUnits(b, d)), 0);
  const supply = Number(formatUnits(supplyRaw as bigint, d));
  return { burned, supply };
}
