import { createPublicClient, http, zeroAddress, type Address, type PublicClient } from "viem";
import { robinhoodChain } from "../chain";
import { v2FactoryAbi } from "./abisV2";
import { v2Factory } from "./registry";

let cached: PublicClient | null = null;
export function ponsClient(): PublicClient {
  if (!cached) cached = createPublicClient({ chain: robinhoodChain, transport: http() });
  return cached;
}

const factory = () => v2Factory();

// --- Launch configs -------------------------------------------------------

export interface LaunchConfig {
  id: bigint;
  supply: bigint;
  curveFeeBps: bigint;
  phantomQuote: bigint;
  graduationThreshold: bigint;
  poolFee: number;
  tickSpacing: number;
  enabled: boolean;
}

/** Configs open for new launches (disabled ids revert at launch). */
export async function openLaunchConfigs(): Promise<LaunchConfig[]> {
  const client = ponsClient();
  const f = factory();
  const count = (await client.readContract({
    address: f,
    abi: v2FactoryAbi,
    functionName: "launchConfigCount",
  })) as bigint;

  const raw = await Promise.all(
    Array.from({ length: Number(count) }, (_, id) =>
      client.readContract({ address: f, abi: v2FactoryAbi, functionName: "getLaunchConfig", args: [BigInt(id)] }),
    ),
  );

  return raw
    .map((c, id) => ({ id: BigInt(id), ...(c as Omit<LaunchConfig, "id">) }))
    .filter((c) => c.enabled);
}

// --- Quote assets ---------------------------------------------------------

export interface UsableQuoteAsset {
  asset: Address;
  symbol: string;
  name: string;
  graduationThreshold: bigint;
  decimals: number;
}

/** Keep only quote assets the factory actually approves (else launch reverts). */
export async function usableQuoteAssets(
  candidates: { symbol: string; name: string; address: Address }[],
): Promise<UsableQuoteAsset[]> {
  const client = ponsClient();
  const f = factory();

  const checked = await Promise.all(
    candidates.map(async ({ symbol, name, address: asset }): Promise<UsableQuoteAsset | null> => {
      if (asset === zeroAddress) return null;
      try {
        const [approved, economics] = await Promise.all([
          client.readContract({ address: f, abi: v2FactoryAbi, functionName: "approvedPairTokens", args: [asset] }),
          client.readContract({ address: f, abi: v2FactoryAbi, functionName: "pairTokenEconomics", args: [asset] }),
        ]);
        const [phantomQuote, graduationThreshold, decimals] = economics as [bigint, bigint, number];
        if (!approved || phantomQuote === 0n || graduationThreshold === 0n) return null;
        return { asset, symbol, name, graduationThreshold, decimals: Number(decimals) || 18 };
      } catch {
        return null;
      }
    }),
  );

  return [
    { asset: zeroAddress, symbol: "ETH", name: "Ether", graduationThreshold: 0n, decimals: 18 },
    ...checked.filter((x): x is UsableQuoteAsset => x !== null),
  ];
}

// --- Launch gate + fee + economics pin ------------------------------------

export async function canLaunch(account: Address): Promise<boolean> {
  const client = ponsClient();
  return (await client.readContract({
    address: factory(),
    abi: v2FactoryAbi,
    functionName: "canLaunch",
    args: [account],
  })) as boolean;
}

export async function launchFee(): Promise<bigint> {
  const client = ponsClient();
  return (await client.readContract({ address: factory(), abi: v2FactoryAbi, functionName: "launchFee" })) as bigint;
}

/** Pin economics so a launch cannot settle on terms you did not read. */
export async function previewLaunchEconomics(launchConfigId: bigint, pairToken: Address): Promise<`0x${string}`> {
  const client = ponsClient();
  return (await client.readContract({
    address: factory(),
    abi: v2FactoryAbi,
    functionName: "previewLaunchEconomics",
    args: [launchConfigId, pairToken],
  })) as `0x${string}`;
}
