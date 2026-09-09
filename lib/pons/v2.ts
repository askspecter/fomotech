import { isAddress, parseEther, toHex, zeroAddress, type Address } from "viem";
import { v2FactoryAbi, v2LaunchAndBuyAbi } from "./abisV2";
import { PONS_V2, v2Factory } from "./registry";
import { canLaunch, launchFee, previewLaunchEconomics } from "./readerV2";
import type { LaunchInput, LaunchPlan } from "./types";

/**
 * PONS v2: the token starts on an ETH-denominated bonding curve holding the
 * full supply, then auto-graduates into a permanently locked Uniswap V4 pool
 * once the curve fills. Creators are paid in ETH; buyback optional.
 *
 * Deploy uses the verified launchToken() write path (docs.ponsfamily.com/v2):
 * pins economics with previewLaunchEconomics, reads launchFee() live, and
 * derives a CREATE2 salt from fresh randomness.
 *
 * v2 is UNAUDITED and public launches are whitelist gated — prepareLaunch
 * checks canLaunch() and surfaces a clear warning when the wallet is not listed.
 */
export async function prepareV2Launch(input: LaunchInput, account: Address): Promise<LaunchPlan> {
  const factory = v2Factory();
  const pairToken = (input.pairToken ?? zeroAddress) as Address;
  const launchConfigId = BigInt(input.launchConfigId ?? 0);
  const warnings: string[] = [];

  // Non-blocking whitelist check. v2 launches are whitelist gated on-chain: if
  // the wallet is not allowlisted, launchToken() reverts no matter how correct
  // the calldata is. We surface the reason up front so a revert is not a mystery.
  const allowed = await canLaunch(account).catch(() => null);
  if (allowed === false) {
    warnings.push(
      "This wallet is not on the PONS v2 whitelist, so the launch will revert on-chain (only gas is spent). Ask PONS to whitelist this address, or use a wallet that has launched before.",
    );
  }

  const [expectedEconomics, fee] = await Promise.all([
    previewLaunchEconomics(launchConfigId, pairToken),
    launchFee(),
  ]);

  const salt = toHex(crypto.getRandomValues(new Uint8Array(32)));

  // Creator fees go to the fomo profile's wallet when the launchpad provides a
  // valid, non-zero address; otherwise they fall back to the deployer. The
  // factory rejects the zero address, so we never pass it.
  const requested = input.creatorFeeRecipient;
  const useProfile = !!requested && isAddress(requested) && requested !== zeroAddress;
  const creatorFeeRecipient = (useProfile ? requested : account) as Address;
  if (useProfile) {
    warnings.push(
      `Creator fees will be paid to ${creatorFeeRecipient}, the fomo profile's wallet, not your deployer wallet.`,
    );
  }

  const params = {
    name: input.name,
    symbol: input.ticker,
    logo: input.imageUri,
    description: input.description,
    socials: {
      twitter: input.twitter?.trim() ?? "",
      telegram: input.telegram?.trim() ?? "",
      discord: "",
      website: input.website?.trim() ?? "",
      farcaster: "",
    },
    creatorFeeRecipient,
    creatorTaxBps: 0,
    buybackEnabled: input.buybackEnabled ?? true,
    expectedEconomics,
    salt,
  };

  const quoteLabel = pairToken === zeroAddress ? "ETH (native)" : pairToken;

  const initialBuy = input.initialBuyEth ? parseEther(input.initialBuyEth) : 0n;
  if (initialBuy > 0n) {
    if (pairToken !== zeroAddress) {
      throw new Error(
        "Initial buy is only wired for native ETH launches here. For an ERC-20 pair, approve the router first (not implemented in this flow).",
      );
    }
    warnings.push(
      "Atomic create plus buy: minTokensOut is 0 (accept any), since this first buy is front run proof by construction.",
    );
    // params.creatorFeeRecipient is already resolved and non-zero (profile
    // wallet or deployer), which launchAndBuy requires. The buy recipient stays
    // the deployer so the first tokens land in the launcher's wallet.
    return {
      address: PONS_V2.launchAndBuy,
      abi: v2LaunchAndBuyAbi,
      functionName: "launchAndBuy",
      args: [params, launchConfigId, pairToken, initialBuy, 0n, account, []],
      value: fee + initialBuy,
      summary: `Launch "${input.name}" ($${input.ticker}) and buy ${input.initialBuyEth} ETH in one transaction (PONS v2).`,
      warnings,
    };
  }

  return {
    address: factory,
    abi: v2FactoryAbi,
    functionName: "launchToken",
    args: [params, launchConfigId, pairToken, []],
    value: fee,
    summary: `Launch "${input.name}" ($${input.ticker}) via PONS v2 bonding curve (quote ${quoteLabel}).`,
    warnings,
  };
}
