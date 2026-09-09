// PONS v2 launch types (trimmed to the v2 bonding-curve path).

export type QuoteAsset = string; // display symbol, e.g. "ETH", "USDG"

/** The form that feeds a v2 launch. */
export interface LaunchInput {
  name: string;
  ticker: string;
  description: string;
  imageUri: string; // hosted URL (fomo profile picture) or data: URI
  /** Quote/pair token address; zero address = native ETH. */
  pairToken?: `0x${string}`;
  /** On-chain launch config id. Default 0. */
  launchConfigId?: number;
  /** Enable protocol buybacks for this launch. */
  buybackEnabled?: boolean;
  /** Optional initial dev buy, in ETH. */
  initialBuyEth?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

/** An executable launch plan the adapter hands back (signed via writeContract). */
export interface LaunchPlan {
  address: `0x${string}`;
  abi: unknown;
  functionName: string;
  args: readonly unknown[];
  value: bigint;
  summary: string;
  warnings: string[];
}
