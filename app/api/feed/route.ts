import { NextResponse } from "next/server";
import { getAlerts } from "@/lib/fomo-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const alerts = await getAlerts(40);
    return NextResponse.json({ alerts });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
