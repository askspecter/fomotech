import { NextResponse } from "next/server";
import { getTokenSafety } from "@/lib/fomo-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  try {
    const token = await getTokenSafety(q);
    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
