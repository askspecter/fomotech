import { NextResponse } from "next/server";
import { getFeed } from "@/lib/fomo-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const feed = await getFeed();
    return NextResponse.json({ feed });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
