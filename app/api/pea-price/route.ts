import { NextResponse } from "next/server";
import { getPeaPrice } from "@/lib/pea-price";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Live $PEA price from the PONS bonding curve (RPC) + ETH/USD.
export async function GET() {
  const data = await getPeaPrice();
  return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
}
