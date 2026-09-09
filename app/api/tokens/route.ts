import { NextResponse } from "next/server";
import { getTokenIntel, NETWORK_IDS } from "@/lib/fomo-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const chain = searchParams.get("chain") ?? "";
  const networkId = chain && NETWORK_IDS[chain] ? NETWORK_IDS[chain] : undefined;
  try {
    const intel = await getTokenIntel(q, networkId);
    return NextResponse.json({ intel });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
