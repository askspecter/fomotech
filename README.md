# fomotech — fomo companion

A web platform that plugs into the [fomo](https://fomoapi.io) social crypto
trading ecosystem. Built as a modular dashboard so you can grow it beyond a
single page.

## Modules

| Route          | Module        | fomo API used                                                    |
| -------------- | ------------- | ---------------------------------------------------------------- |
| `/`            | Dashboard     | `/v2/leaderboard/{window}` + `/v2/leaderboard/tokens/trending`   |
| `/leaderboard` | Leaderboard   | `/v2/leaderboard/{window}` (24h · 7d · 30d · all)                |
| `/feed`        | Live Feed     | `/v2/alerts` firehose (buy/sell/thesis/whale), polled            |
| `/tokens`      | Token Intel   | `/v2/token/{addr}/stats` + `/token/{addr}/holders` + `/devs`     |

- **Dashboard** — market summary (volume, net PnL, traders, trades) derived
  from the leaderboard, a top-traders-by-PnL chart, and the trending-tokens board.
- **Leaderboard** — top traders with PnL, volume, trades, holdings, followers,
  wallets, and the verified flag, per time window.
- **Live Feed** — the fomo activity firehose with buy/sell/thesis/whale filters
  and a pause button.
- **Token Intel** — smart-money holders, multi-window flow (net volume, buy/sell
  counts, top-10 concentration), and dev positions with their thesis (rug signal).

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (dark crypto-app theme)
- **Recharts** for charts
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
