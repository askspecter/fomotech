import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Same-origin image proxy so avatars from external CDNs can be drawn into the
 * shareable card canvas without tainting it. Only proxies https image
 * responses, capped in size.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url") ?? "";
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }
  if (target.protocol !== "https:") return new NextResponse("https only", { status: 400 });
  // Block obvious internal targets.
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(target.hostname)) {
    return new NextResponse("blocked", { status: 400 });
  }
  try {
    const res = await fetch(target.toString(), { signal: AbortSignal.timeout(6000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return new NextResponse("not an image", { status: 415 });
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 6_000_000) return new NextResponse("too large", { status: 413 });
    return new NextResponse(buf, {
      headers: { "content-type": type, "cache-control": "public, max-age=86400" },
    });
  } catch {
    return new NextResponse("fetch failed", { status: 502 });
  }
}
