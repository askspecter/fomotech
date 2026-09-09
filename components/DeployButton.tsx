"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { BaseError, ContractFunctionRevertedError, type Abi } from "viem";
import { prepareV2Launch } from "@/lib/pons/v2";
import type { LaunchInput } from "@/lib/pons/types";
import { robinhoodChain, explorerTx } from "@/lib/chain";

/**
 * Deploy a PONS v2 launch: prepare the plan from the input, let the wallet
 * simulate then sign launchToken(). Engine logic is in lib/pons; this is the
 * presentation and wallet wiring.
 */
export function DeployButton({ input, disabled }: { input: LaunchInput; disabled?: boolean }) {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<"idle" | "preparing" | "signing" | "sent" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  function revertReason(err: unknown): string {
    if (err instanceof BaseError) {
      const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
      if (revert instanceof ContractFunctionRevertedError) {
        const name = revert.data?.errorName;
        if (name) return `${name}${revert.reason ? `: ${revert.reason}` : ""}`;
        if (revert.reason) return revert.reason;
      }
      return err.shortMessage || err.message;
    }
    return err instanceof Error ? err.message.split("\n")[0] : "unknown error";
  }

  // On-chain metadata must be short; a data: URI logo makes the factory revert
  // with MetadataTooLong(). Drop a data: URI and clamp the description.
  function sanitize(i: LaunchInput): LaunchInput {
    const logo = i.imageUri.startsWith("data:") || i.imageUri.length > 300 ? "" : i.imageUri;
    return { ...i, imageUri: logo, description: (i.description ?? "").slice(0, 500) };
  }

  async function deploy() {
    setError(null);
    setWarnings([]);
    if (!address) return;
    try {
      if (chainId !== robinhoodChain.id) {
        try {
          await switchChainAsync({ chainId: robinhoodChain.id });
        } catch {
          throw new Error(
            `Your wallet must be on ${robinhoodChain.name} (chain ${robinhoodChain.id}). Switch networks, this is an EVM chain not Solana, then try again.`,
          );
        }
      }
      setStatus("preparing");
      const plan = await prepareV2Launch(sanitize(input), address);
      setWarnings(plan.warnings);

      if (publicClient) {
        try {
          await publicClient.simulateContract({
            account: address,
            address: plan.address,
            abi: plan.abi as Abi,
            functionName: plan.functionName,
            args: plan.args as unknown[],
            value: plan.value,
          });
        } catch (simErr) {
          throw new Error("This launch would revert on-chain. Reason: " + revertReason(simErr));
        }
      }

      setStatus("signing");
      const hash = await writeContractAsync({
        address: plan.address,
        abi: plan.abi as Abi,
        functionName: plan.functionName,
        args: plan.args as unknown[],
        value: plan.value,
        chainId: robinhoodChain.id,
      });
      setTxHash(hash);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Transaction failed.");
    }
  }

  if (status === "sent" && txHash) {
    return (
      <a
        className="block w-full rounded-lg bg-up px-4 py-3 text-center text-sm font-semibold text-white"
        href={explorerTx(txHash)}
        target="_blank"
        rel="noreferrer"
      >
        Launched. View on explorer
      </a>
    );
  }

  if (isConnected && chainId !== robinhoodChain.id) {
    return (
      <button
        className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-bright"
        disabled={switching}
        onClick={async () => {
          try {
            await switchChainAsync({ chainId: robinhoodChain.id });
          } catch {
            /* rejected */
          }
        }}
      >
        {switching ? "Switching" : "Switch to Robinhood Chain"}
      </button>
    );
  }

  const blocked = disabled || !isConnected;
  const busy = status === "preparing" || status === "signing";
  const label =
    status === "preparing" ? "Reading on-chain" : status === "signing" ? "Sign in your wallet" : "Deploy on PONS v2";

  return (
    <div className="space-y-2">
      {warnings.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-yellow-500/30 bg-yellow-500/[0.06] p-3 text-xs text-yellow-400">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-50"
        disabled={blocked || busy}
        onClick={deploy}
      >
        {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {label}
      </button>
      {!isConnected && <p className="text-xs text-muted">Connect your wallet to deploy.</p>}
      {error && <p className="whitespace-pre-wrap text-xs text-down">{error}</p>}
    </div>
  );
}
