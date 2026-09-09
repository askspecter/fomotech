# fomotech — fomo.family companion

A web platform that plugs into the [fomo](https://fomo.family) social crypto
trading ecosystem. It's built as a modular dashboard so you can grow it beyond
a single analytics page.

## Modules

| Route          | Module          | What it does                                                |
| -------------- | --------------- | ----------------------------------------------------------- |
| `/`            | Dashboard       | Market stats, 24h volume chart, trending tokens             |
| `/leaderboard` | Leaderboard     | Top traders ranked by realized PnL, ROI, win rate           |
| `/feed`        | Live Feed       | Real-time buy/sell stream with a whale filter (polls 4s)    |
| `/tokens`      | Token Scanner   | Per-token safety checks (liquidity, honeypot, mint, etc.)   |

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling (dark, crypto-app aesthetic)
- **Recharts** for charts
- Route handlers under `app/api/*` keep your API key server-side

## Connecting your fomo API

The app ships with built-in sample data so it runs with **zero configuration**.
When you're ready to wire in the real API:

1. Copy the env template:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in your values:
   ```
   FOMO_API_BASE_URL=https://api.fomo.family
   FOMO_API_KEY=your_key_here
   NEXT_PUBLIC_FOMO_DATA_SOURCE=live
   ```
3. Open `lib/fomo-api.ts` — it's the **only** file that talks to the API.
   Each getter has a `// TODO` marking where to set the real endpoint path and
   map the response onto the UI types in `lib/types.ts`.

> The auth header in `fomoFetch()` defaults to `Authorization: Bearer <key>`.
> Switch it to `x-api-key` (or whatever your API uses) in that one function.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## Project layout

```
app/
  page.tsx            Dashboard
  leaderboard/        Leaderboard
  feed/               Live feed (client, polling)
  tokens/             Token scanner (client, search)
  api/feed/           Feed JSON endpoint
  api/tokens/         Token safety endpoint
components/           Sidebar, Topbar, StatCard, VolumeChart
lib/
  types.ts            Domain types the UI consumes
  fomo-api.ts         Pluggable API client (mock ↔ live)
  mock.ts             Sample data generators
  format.ts           Currency / number / time formatters
```

## Notes

- `npm audit` may flag a build-time `postcss` advisory pulled in transitively by
  Next.js 14; it does not affect the running app (no untrusted CSS is processed).
  It clears when you upgrade to a newer Next major.
