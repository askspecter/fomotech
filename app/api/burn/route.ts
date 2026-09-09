import { NextResponse } from "next/server";
import { getPeaBurn } from "@/lib/burn";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Live $PEA burn, read on-chain via RPC (server-side, no explorer/CORS needed).
export async function GET() {
  try {
    const data = await getPeaBurn();
    return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ burned: null, supply: null }, { status: 200 });
  }
}
