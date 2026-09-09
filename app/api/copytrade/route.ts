import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/fomo-api";
import type { Trader } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/copytrade?handles=a,b,c
 * Matches the copied handles against the 24h leaderboard (1 credit) instead of
 * resolving each profile (10 credits each). Handles not in the top board come
 * back as "misses" so the UI can link out to the explorer.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handles = (searchParams.get("handles") ?? "")
    .split(",")
    .map((h) => h.trim().replace(/^@/, ""))
    .filter(Boolean);

  if (handles.length === 0) return NextResponse.json({ matched: [], misses: [] });

  try {
    const board = await getLeaderboard("24h", 150);
    const byHandle = new Map<string, Trader>();
    for (const t of board) byHandle.set(t.handle.toLowerCase(), t);

    const matched: Trader[] = [];
    const misses: string[] = [];
    for (const h of handles) {
      const t = byHandle.get(h.toLowerCase());
      if (t) matched.push(t);
      else misses.push(h);
    }
    matched.sort((a, b) => b.pnlUsd - a.pnlUsd);
    return NextResponse.json({ matched, misses });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
