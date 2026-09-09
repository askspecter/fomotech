"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Topbar from "@/components/Topbar";
import Verified from "@/components/Verified";
import { DeployButton } from "@/components/DeployButton";
import type { LaunchInput } from "@/lib/pons/types";
import type { TraderProfile } from "@/lib/types";
import { V2_GRADUATION_THRESHOLD_ETH } from "@/lib/pons/registry";
import { formatEther } from "viem";

interface QuoteAsset {
  asset: string;
  symbol: string;
  name: string;
  decimals: number;
}
interface LaunchConfig {
  id: string;
  supply: string;
}
interface LaunchOptions {
  launchFee: string;
  canLaunch: boolean | null;
  configs: LaunchConfig[];
  quoteAssets: QuoteAsset[];
}

const ZERO = "0x0000000000000000000000000000000000000000";

function tickerFrom(handle: string): string {
  return (handle || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
}

export default function LaunchpadPage() {
  const { address } = useAccount();

  const [handle, setHandle] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profile, setProfile] = useState<TraderProfile | null>(null);

  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [pairToken, setPairToken] = useState<string>(ZERO);
  const [configId, setConfigId] = useState("0");
  const [initialBuyEth, setInitialBuyEth] = useState("");
  const [buyback, setBuyback] = useState(true);
  const [feeWallet, setFeeWallet] = useState<string>("");
  const [routeFeesToProfile, setRouteFeesToProfile] = useState(true);

  const [options, setOptions] = useState<LaunchOptions | null>(null);

  async function loadProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!handle.trim()) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/profile?handle=${encodeURIComponent(handle)}`, { cache: "no-store" });
      const { profile } = await res.json();
      setProfile(profile);
      if (profile?.found) {
        setName(profile.displayName || profile.handle);
        setTicker(tickerFrom(profile.handle));
        setDescription(profile.description || `${profile.displayName} on fomo.`);
        setImageUri(profile.profilePictureLink || "");
        setFeeWallet(profile.wallets?.evm || "");
        setRouteFeesToProfile(Boolean(profile.wallets?.evm));
      }
    } finally {
      setLoadingProfile(false);
    }
  }

  // Launch options (configs, quote assets, fee, whitelist gate) from the factory.
  useEffect(() => {
    const qs = address ? `?address=${address}` : "";
    fetch(`/api/v2/launch-options${qs}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((o: LaunchOptions) => {
        setOptions(o);
        if (o.configs[0]) setConfigId(o.configs[0].id);
      })
      .catch(() => {});
  }, [address]);

  const feeToProfile = routeFeesToProfile && /^0x[0-9a-fA-F]{40}$/.test(feeWallet);

  const input: LaunchInput = {
    name: name.trim(),
    ticker: ticker.trim(),
    description: description.trim(),
    imageUri: imageUri.trim(),
    pairToken: pairToken as `0x${string}`,
    launchConfigId: Number(configId) || 0,
    buybackEnabled: buyback,
    creatorFeeRecipient: feeToProfile ? (feeWallet as `0x${string}`) : undefined,
    initialBuyEth: initialBuyEth.trim() || undefined,
    twitter: profile?.handle,
  };

  const ready = Boolean(input.name && input.ticker);
  const feeEth = options?.launchFee && options.launchFee !== "0" ? formatEther(BigInt(options.launchFee)) : null;

  return (
    <>
      <Topbar title="Launchpad" subtitle="Launch a fomo profile token on PONS v2" wallet />
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_360px]">
        {/* Left: pick profile + edit */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="mb-1 font-semibold">1. Pick a fomo profile</h2>
            <p className="mb-3 text-sm text-muted">
              Load a trader from fomo and turn their profile into a token, seeded with their name and avatar.
            </p>
            <form onSubmit={loadProfile} className="flex gap-2">
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="fomo handle, e.g. CryptoKaleo"
                className="min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={loadingProfile}
                className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-50"
              >
                {loadingProfile ? "Loading" : "Load"}
              </button>
            </form>
            {profile && !profile.found && <p className="mt-3 text-sm text-down">No trader found for that handle.</p>}
            {profile?.found && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
                {imageUri ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUri} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-brand/20 text-sm font-bold text-brand-bright">
                    {profile.handle.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-sm">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    @{profile.handle}
                    {profile.verified && <Verified className="text-brand-bright" />}
                  </span>
                  <div className="text-xs text-muted">{profile.followers.toLocaleString()} followers</div>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-semibold">2. Token details</h2>
            <div className="space-y-3">
              <Field label="Name">
                <input value={name} onChange={(e) => setName(e.target.value)} className="inp" placeholder="Token name" />
              </Field>
              <Field label="Ticker">
                <input value={ticker} onChange={(e) => setTicker(tickerFrom(e.target.value))} className="inp" placeholder="TICKER" />
              </Field>
              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="inp resize-none"
                  placeholder="What is this token?"
                />
              </Field>
              <Field label="Logo URL">
                <input value={imageUri} onChange={(e) => setImageUri(e.target.value)} className="inp" placeholder="https://..." />
              </Field>
            </div>
          </div>
        </div>

        {/* Right: launch config + deploy */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">3. Launch settings</h2>
            <div className="space-y-3">
              <Field label="Quote asset">
                <select value={pairToken} onChange={(e) => setPairToken(e.target.value)} className="inp">
                  {(options?.quoteAssets ?? [{ asset: ZERO, symbol: "ETH", name: "Ether", decimals: 18 }]).map((q) => (
                    <option key={q.asset} value={q.asset}>
                      {q.symbol} {q.name && q.symbol !== q.name ? `(${q.name})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              {options && options.configs.length > 0 && (
                <Field label="Launch config">
                  <select value={configId} onChange={(e) => setConfigId(e.target.value)} className="inp">
                    {options.configs.map((c) => (
                      <option key={c.id} value={c.id}>
                        Config {c.id}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Initial buy (ETH, optional)">
                <input
                  value={initialBuyEth}
                  onChange={(e) => setInitialBuyEth(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="inp"
                  placeholder="0.0"
                  inputMode="decimal"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={buyback} onChange={(e) => setBuyback(e.target.checked)} className="h-4 w-4 accent-brand" />
                Enable protocol buybacks
              </label>

              <div className="rounded-xl border border-border bg-surface-2 p-3">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={routeFeesToProfile}
                    disabled={!feeWallet}
                    onChange={(e) => setRouteFeesToProfile(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-brand"
                  />
                  <span>
                    Route creator fees to the fomo profile
                    <span className="mt-0.5 block text-xs text-muted">
                      {feeWallet
                        ? feeToProfile
                          ? `Fees accrue to ${feeWallet.slice(0, 6)}..${feeWallet.slice(-4)}, the profile wallet.`
                          : "Off: fees accrue to your deployer wallet."
                        : "Load a fomo profile with a wallet to enable this."}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <dl className="mt-4 space-y-1 border-t border-border pt-4 text-xs text-muted">
              <Row k="Model" v="Bonding curve, graduates to Uniswap V4" />
              <Row k="Graduation" v={`~${V2_GRADUATION_THRESHOLD_ETH} ETH (per config)`} />
              {feeEth && <Row k="Launch fee" v={`${feeEth} ETH`} />}
              <Row
                k="Creator fees"
                v={feeToProfile ? `@${profile?.handle}` : "Your deployer wallet"}
                tone={feeToProfile ? "up" : undefined}
              />
              {options?.canLaunch === false && <Row k="Whitelist" v="This wallet is not allowlisted" tone="down" />}
              {options?.canLaunch === true && <Row k="Whitelist" v="This wallet can launch" tone="up" />}
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-semibold">4. Deploy</h2>
            <DeployButton input={input} disabled={!ready} />
            <p className="mt-3 text-xs text-muted">
              Non-custodial: your wallet signs the transaction on Robinhood Chain. PONS v2 is unaudited and public launches are whitelist gated.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "up" | "down" }) {
  return (
    <div className="flex items-center justify-between">
      <dt>{k}</dt>
      <dd className={tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-white"}>{v}</dd>
    </div>
  );
}
