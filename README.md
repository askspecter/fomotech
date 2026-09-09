# PEA — fomo companion

A web platform that plugs into the [fomo](https://fomoapi.io) social crypto
trading ecosystem. Built as a modular dashboard so you can grow it beyond a
single page.

**Robinhood Chain only.** Every token, feed event, portfolio holding, and token
scan is filtered to Robinhood Chain (network id 4663); assets on other chains are
never shown. The filter lives in `lib/fomo-api.ts` (`isRobinhood`).

## Modules

| Route          | Module          | Data source                                                      |
| -------------- | --------------- | ---------------------------------------------------------------- |
| `/`            | Dashboard       | `/v2/leaderboard/{window}` + `/v2/leaderboard/tokens/trending`   |
| `/leaderboard` | Leaderboard     | `/v2/leaderboard/{window}` (24h, 7d, 30d, all)                   |
| `/feed`        | Live Feed       | `/v2/alerts` firehose (buy/sell/thesis/whale), polled            |
| `/tokens`      | Token Intel     | `/v2/token/{addr}/stats` + `/token/{addr}/holders` + `/devs`     |
| `/alerts`      | Alerts          | `/v2/alerts` filtered to a watchlist of traders/tokens + whales  |
| `/trader`      | Trader Explorer | `/v2/users/{handle}` + `/trades` + `/balances` + `/following`    |
| `/copytrade`   | Copytrade       | copied handles matched against `/v2/leaderboard/24h`             |
| `/launchpad`   | Launchpad       | PONS v2 contracts on Robinhood Chain (wallet-signed)             |

- **Dashboard** — market summary (volume, net PnL, traders, trades) derived
  from the leaderboard, a top-traders-by-PnL chart, and the trending-tokens board.
- **Leaderboard** — top traders with PnL, volume, trades, holdings, followers,
  wallets, and the verified flag, per time window.
- **Live Feed** — the fomo activity firehose with buy/sell/thesis/whale filters
  and a pause button.
- **Token Intel** — smart-money holders, multi-window flow (net volume, buy/sell
  counts, top-10 concentration), and dev positions with their thesis (rug signal).
- **Alerts** — a per-browser watchlist of traders and tokens; the `/v2/alerts`
  stream is filtered to your watchlist plus whale moves over $25k.
- **Trader Explorer** — a trader's profile, portfolio, recent trades, and who
  they follow. Add them to Copytrade or your Alerts watchlist in one click.
- **Copytrade** — the traders you copy, ranked by live 24h PnL. To keep credit
  use low, copied handles are matched against the 24h leaderboard (1 credit)
  rather than resolved one profile at a time (10 credits each).
- **Launchpad** — turn a fomo profile into a token and deploy it on the PONS v2
  bonding curve (Robinhood Chain). Seeds the token name, ticker, and avatar from
  the trader's profile; your own wallet signs the non-custodial launch.

## Launchpad (PONS v2)

The launchpad reuses the proven PONS v2 launch engine (the same contracts used by
[Pork / Launchpad-Base](https://github.com/askspecter/Launchpad-Base)), ported into
`lib/pons/`:

- `lib/chain.ts` — Robinhood Chain (id 4663)
- `lib/pons/registry.ts` — verified v2 contract addresses + quote assets
- `lib/pons/abisV2.ts` — verified factory ABI (launchToken / launchAndBuy)
- `lib/pons/readerV2.ts` — launch configs, quote assets, fee, whitelist gate
- `lib/pons/v2.ts` — prepares the signed launch plan

Deploy flow: pick a fomo profile, edit the token, pick a quote asset (ETH or an
RWA pair), then sign. The app simulates the transaction first so a revert shows
its real reason before any gas is spent. PONS v2 is unaudited and public launches
are whitelist gated, so the UI reads `canLaunch()` and warns up front.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (dark theme)
- **Recharts** for charts
- **wagmi + viem + RainbowKit** for the non-custodial wallet (launchpad)
- Route handlers under `app/api/*` keep your API key server-side

## Connecting the fomo API

Ships with built-in sample data, so it runs with **zero config and zero credits**.
To use the real API:

1. Create a free key at <https://fomoapi.io> (1,000 credits/month).
2. Configure env:
   ```bash
   cp .env.example .env.local
   ```
   ```
   FOMO_API_BASE_URL=https://api.fomoapi.io
   FOMO_API_KEY=your_key_here
   NEXT_PUBLIC_FOMO_DATA_SOURCE=live
   ```
3. That's it — `lib/fomo-api.ts` is the only file that talks to the API. Each
   getter already targets the real endpoint and maps the response onto the UI
   types in `lib/types.ts`.

### Credit awareness

Billing is usage-based credits (a leaderboard/normal call = 1, `/v2/alerts` =
0.5, a thesis = 5/page, a wallet resolution = 10). The Live Feed polls
`/v2/alerts`, so its interval is configurable and defaults to 15s:

```
NEXT_PUBLIC_FEED_POLL_MS=15000   # ~120 credits/hr while the tab is open
```

For a production feed, swap polling for the `wss://api.fomoapi.io/ws/alerts`
WebSocket (messages are free) — see "Next steps" below.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
```

## Project layout

```
app/
  page.tsx            Dashboard
  leaderboard/        Leaderboard (window tabs)
  feed/               Live feed (client, polling)
  tokens/             Token intel (client, search)
  api/feed/           -> getAlerts()
  api/tokens/         -> getTokenIntel()
components/           Sidebar, Topbar, StatCard, PnlBarChart, WindowTabs
lib/
  types.ts            Domain types mapped from the fomo API
  fomo-api.ts         Pluggable API client (mock <-> live)
  mock.ts             Sample data generators
  format.ts           Currency / number / time formatters
```

## Next steps (ideas)

- **WebSocket feed** — replace `/v2/alerts` polling with `/ws/alerts` via a
  server-side proxy (keeps the key off the client) for realtime, credit-free.
- **Trader explorer** — a `/trader/[handle]` page using `/v2/users/{handle}`,
  `/trades`, `/balances`, and `/following` (copy-trading intel).
- **Global search** — `/v2/search` across traders and tokens.
- **Alerts/notifications** — watch a trader or token, notify on whale moves.

## Notes

- `npm audit` may flag a build-time `postcss` advisory pulled in transitively by
  Next.js 14; it does not affect the running app (no untrusted CSS is processed).
