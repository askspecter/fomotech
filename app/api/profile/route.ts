import { NextResponse } from "next/server";
import { getTraderProfile } from "@/lib/fomo-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle") ?? "";
  if (!handle.trim()) return NextResponse.json({ error: "handle required" }, { status: 400 });
  try {
    const profile = await getTraderProfile(handle);
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
