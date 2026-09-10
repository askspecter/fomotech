import { NextResponse } from "next/server";
import { createPublicClient, http, formatUnits, isAddress, type Address } from "viem";
import { robinhoodChain } from "@/lib/chain";
import { PEA_TOKEN } from "@/lib/burn";

export const dynamic = "force-dynamic";

const ERC20 = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "a", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

// Read a wallet's $PEA balance on-chain via RPC (reliable, no explorer needed).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") ?? "").trim();
  if (!isAddress(address)) return NextResponse.json({ error: "invalid address" }, { status: 400 });
  try {
    const client = createPublicClient({ chain: robinhoodChain, transport: http() });
    const [bal, dec] = await Promise.all([
      client.readContract({ address: PEA_TOKEN, abi: ERC20, functionName: "balanceOf", args: [address as Address] }),
      client.readContract({ address: PEA_TOKEN, abi: ERC20, functionName: "decimals" }),
    ]);
    const balance = Number(formatUnits(bal as bigint, Number(dec) || 18));
    return NextResponse.json({ address, balance }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "lookup failed" }, { status: 502 });
  }
}
