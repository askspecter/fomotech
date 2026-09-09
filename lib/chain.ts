import { defineChain } from "viem";

// Treat a set-but-empty env value the same as unset.
function env(name: string, fallback: string): string {
  const v = process.env[name as keyof NodeJS.ProcessEnv] as string | undefined;
  return v && v.trim() ? v.trim() : fallback;
}

const DEFAULT_CHAIN_ID = 4663;
const parsed = Number(env("NEXT_PUBLIC_CHAIN_ID", String(DEFAULT_CHAIN_ID)));
const CHAIN_ID = Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_CHAIN_ID;

const RPC_URL = env("NEXT_PUBLIC_RPC_URL", "https://rpc.mainnet.chain.robinhood.com");
const EXPLORER_URL = env("NEXT_PUBLIC_EXPLORER_URL", "https://robinhoodchain.blockscout.com");

/**
 * Robinhood Chain (id 4663) — the network PONS v2 runs on. Native currency ETH,
 * an L2 built on Arbitrum Orbit.
 */
export const robinhoodChain = defineChain({
  id: CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "Blockscout", url: EXPLORER_URL } },
});

export const explorerUrl = EXPLORER_URL;
export const explorerTx = (hash: string) => `${explorerUrl}/tx/${hash}`;
export const explorerToken = (address: string) => `${explorerUrl}/token/${address}`;
