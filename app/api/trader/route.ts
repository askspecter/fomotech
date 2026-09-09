import { NextResponse } from "next/server";
import { getTraderProfile, getUserTrades, getUserBalances } from "@/lib/fomo-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle") ?? "";
  if (!handle.trim()) return NextResponse.json({ error: "handle required" }, { status: 400 });
  try {
    const profile = await getTraderProfile(handle);
    if (!profile.found) return NextResponse.json({ profile });
    const [trades, portfolio] = await Promise.all([
      getUserTrades(handle, 25).catch(() => []),
      getUserBalances(handle).catch(() => ({ totalValueUsd: 0, byChain: {}, holdings: [] })),
    ]);
    return NextResponse.json({ profile, trades, portfolio });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
