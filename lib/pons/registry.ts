/**
 * PONS v2 contract registry on Robinhood Chain (verified deployment from
 * docs.ponsfamily.com/v2). v2 is deployed but UNAUDITED and public launches are
 * whitelist gated, so always check canLaunch(address) before offering deploy.
 */
export const PONS_V2 = {
  factory: "0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e" as `0x${string}`,
  memeHook: "0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044" as `0x${string}`,
  feeEscrow: "0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e" as `0x${string}`,
  buybackVault: "0x42df2a798f82289E177311362e8f5ccC45c1219c" as `0x${string}`,
  launchLocker: "0x267444D099b10fB5Ed7c3Cc7B7c767AdcA574952" as `0x${string}`,
  launchAndBuy: "0xe33E9E479dF8802cb0866d5d05258bEc4cF62948" as `0x${string}`,
  launchDeployer: "0x3711ceA4feaDE896C913C68F01Eda97Cb06D1A42" as `0x${string}`,
  graduationExecutor: "0xC7819B64A1dAECD7eC19856d026cb14EfBd89046" as `0x${string}`,
  graduationGuard: "0xf5695117b99B6f6401e67d4195BD653628176C6C" as `0x${string}`,
} as const;

/** Factory address (env override wins). */
export function v2Factory(): `0x${string}` {
  return (process.env.NEXT_PUBLIC_PONS_V2_FACTORY as `0x${string}`) || PONS_V2.factory;
}

/**
 * ERC-20 quote-token addresses on Robinhood Chain. Offered as v2 quote assets
 * only after being validated live against the factory (approvedPairTokens plus
 * pairTokenEconomics). Native ETH is always available.
 */
export const V2_QUOTE_TOKENS: { symbol: string; name: string; address: `0x${string}` }[] = [
  { symbol: "USDG", name: "Global Dollar", address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" },
  { symbol: "NVDA", name: "NVIDIA", address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC" },
  { symbol: "SPCX", name: "SpaceX Class A", address: "0x4a0E65A3EcceC6dBe60AE065F2e7bb85Fae35eEa" },
  { symbol: "GOOGL", name: "Alphabet Class A", address: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3" },
  { symbol: "TSLA", name: "Tesla", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d" },
  { symbol: "GME", name: "GameStop", address: "0x1b0E319c6A659F002271B69dB8A7df2F911c153E" },
  { symbol: "AAPL", name: "Apple", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9" },
  { symbol: "SPY", name: "S&P 500 ETF", address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C" },
  { symbol: "AMD", name: "Advanced Micro Devices", address: "0x86923f96303D656E4aa86D9d42D1e57ad2023fdC" },
  { symbol: "AMZN", name: "Amazon", address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54" },
  { symbol: "MSFT", name: "Microsoft", address: "0xe93237C50D904957Cf27E7B1133b510C669c2e74" },
  { symbol: "META", name: "Meta Platforms", address: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35" },
  { symbol: "COIN", name: "Coinbase", address: "0x6330D8C3178a418788dF01a47479c0ce7CCF450b" },
  { symbol: "PLTR", name: "Palantir", address: "0x894e1ec2d74ffe5aef8dc8a9e84686accb964f2a" },
];

/** v2 graduation threshold in ETH (from PONS v2 docs). */
export const V2_GRADUATION_THRESHOLD_ETH = 4.2;
