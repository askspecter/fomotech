import { NextResponse } from "next/server";
import { getUserFollowing } from "@/lib/fomo-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle") ?? "";
  if (!handle.trim()) return NextResponse.json({ error: "handle required" }, { status: 400 });
  try {
    const following = await getUserFollowing(handle, 50);
    return NextResponse.json({ following });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
