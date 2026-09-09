"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Wallet connect button (RainbowKit modal). Rendered client-side only, after
 * mount: RainbowKit reads client.uid as soon as it renders, which throws during
 * SSR before the wagmi client is ready. A static placeholder holds the layout.
 */
export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const base = "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bright";

  if (!mounted) {
    return (
      <div aria-hidden style={{ opacity: 0, pointerEvents: "none" }}>
        <button type="button" className={base}>Connect</button>
      </div>
    );
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted: rkMounted }) => {
        const ready = rkMounted;
        const connected = ready && account && chain;
        return (
          <div {...(!ready && { "aria-hidden": true, style: { opacity: 0, pointerEvents: "none" } })}>
            {!connected ? (
              <button type="button" className={base} onClick={openConnectModal}>
                Connect wallet
              </button>
            ) : chain.unsupported ? (
              <button
                type="button"
                onClick={openChainModal}
                className="rounded-lg border border-yellow-500/50 bg-yellow-500/15 px-3.5 py-2 text-sm font-semibold text-yellow-400"
              >
                Switch to Robinhood
              </button>
            ) : (
              <button
                type="button"
                onClick={openAccountModal}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 py-2 pl-3 pr-3.5 text-sm font-medium text-white"
              >
                <span className="h-2 w-2 rounded-full bg-up" />
                <span className="font-mono">{account.displayName}</span>
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
