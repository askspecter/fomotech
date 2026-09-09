import { NextResponse } from "next/server";
import { getAddress, isAddress, type Address } from "viem";
import { canLaunch, launchFee, openLaunchConfigs, usableQuoteAssets } from "@/lib/pons/readerV2";
import { V2_QUOTE_TOKENS } from "@/lib/pons/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ETH_ROW = {
  asset: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
  graduationThreshold: "0",
};

/**
 * GET /api/v2/launch-options?address=0x...
 * Everything a v2 launch flow needs, read live from the PONS v2 factory: open
 * launch configs, usable quote assets, the launch fee, and whether the given
 * address may launch (public launches are whitelist gated).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  const seen = new Set<string>();
  const candidates: { symbol: string; name: string; address: Address }[] = [];
  for (const t of V2_QUOTE_TOKENS) {
    const key = t.address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ symbol: t.symbol, name: t.name, address: getAddress(t.address) });
  }
  for (const raw of (process.env.NEXT_PUBLIC_V2_PAIR_TOKENS ?? "").split(",")) {
    const s = raw.trim();
    if (!isAddress(s) || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    const short = `${s.slice(0, 6)}..${s.slice(-4)}`;
    candidates.push({ symbol: short, name: short, address: getAddress(s) });
  }

  const registryRows = () => [
    ETH_ROW,
    ...candidates.map((c) => ({ asset: c.address, symbol: c.symbol, name: c.name, decimals: 18, graduationThreshold: "0" })),
  ];

  try {
    const [fee, configs, quoteAssets, gate] = await Promise.all([
      launchFee(),
      openLaunchConfigs(),
      usableQuoteAssets(candidates),
      address && isAddress(address) ? canLaunch(address as Address) : Promise.resolve(null),
    ]);

    let assets = quoteAssets.map((q) => ({
      asset: q.asset,
      symbol: q.symbol,
      name: q.name,
      decimals: q.decimals,
      graduationThreshold: q.graduationThreshold.toString(),
    }));
    if (assets.length <= 1) assets = registryRows();

    return NextResponse.json({
      launchFee: fee.toString(),
      canLaunch: gate,
      configs: configs.map((c) => ({
        id: c.id.toString(),
        supply: c.supply.toString(),
        curveFeeBps: c.curveFeeBps.toString(),
        graduationThreshold: c.graduationThreshold.toString(),
        poolFee: c.poolFee,
        tickSpacing: c.tickSpacing,
      })),
      quoteAssets: assets,
    });
  } catch {
    return NextResponse.json({ launchFee: "0", canLaunch: null, configs: [], quoteAssets: registryRows() });
  }
}
