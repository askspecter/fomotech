"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { WagmiProvider, http, useReconnect } from "wagmi";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { robinhoodChain } from "@/lib/chain";

// wagmi v2 + RainbowKit, wired to Robinhood Chain (PONS v2). WalletConnect
// negotiates an EVM-only (eip155) session, so multi-chain wallets connect on
// Robinhood, never Solana. The next.config webpack aliases stub the unused
// Coinbase connectors, and styles.css is imported in layout.tsx.
const wagmiConfig = getDefaultConfig({
  appName: "PEA",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "pea_missing_wc_project_id",
  chains: [robinhoodChain],
  transports: { [robinhoodChain.id]: http() },
  ssr: true,
  wallets: [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, injectedWallet, rainbowWallet, walletConnectWallet],
    },
  ],
});

const theme = darkTheme({
  accentColor: "#5b7cff",
  accentColorForeground: "#ffffff",
  borderRadius: "large",
  overlayBlur: "small",
  fontStack: "system",
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  // reconnectOnMount={false} avoids the SSR/hydration "e.uid" crash when a
  // stored wallet is on an unsupported chain. We reconnect post-mount instead.
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme} modalSize="compact">
          <AutoReconnect />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function AutoReconnect() {
  const { reconnect } = useReconnect();
  useEffect(() => {
    try {
      reconnect();
    } catch {
      /* ignore */
    }
  }, [reconnect]);
  return null;
}
