# StockStakes ($STAKES)

> Make your call. Put your stake behind it.

Hourly on-chain prediction rounds: set probabilities, stake ETH behind your conviction, and earn when your calls are better calibrated than the room.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Lucide and Geist.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # TypeScript only
```

Requires Node.js 20.9 or newer.

## Deploy to Vercel

Push this folder to a GitHub repo, import it in Vercel, and deploy — no settings needed. Optionally add the environment variables below.

## Where things live

```
app/                 routes: / (home), /rules, /safety, OG image, favicon
components/
  brand/             Logo (animated mark + wordmark), social glyphs
  layout/            Navbar, Footer, ThemeToggle, WalletButton, WalletDialog
  dashboard/         LiveRound, PredictionCard, StakePanel
  sections/          Hero, HeroCard, MarketTape, HowItWorks, Thesis, Markets, Token, Safety
  ui/                Panel, Button, ProbabilitySlider, ProbabilityBar, Countdown, Sparkline, …
data/                market list, round config and site copy
  markets.ts         the market list (one line per market) + price-feed symbols
  rounds.ts          round config (pools/room odds stay empty until contracts are live)
  token.ts           $STAKES info — contractAddress is null (CA Coming Soon)
  site.ts            nav, hero copy, steps, thesis, safety copy
  legal.ts           /rules and /safety page content
lib/
  prices.ts          live price feed (Coinbase, Yahoo Finance, optional Finnhub)
  scoring.ts         illustrative Brier-score payout estimate
  round-clock.ts     hourly close time
  web3/              wallet list + deep links, EIP-6963 discovery, staking interface
providers/           theme, wallet and live-markets context
hooks/               useCountdown
```

## Live data

Prices are live. `GET /api/prices` fetches them on the server and the page refreshes every 30 seconds.

| Market | Source |
|---|---|
| ETH | Coinbase Exchange public candles (fallback: Yahoo Finance) |
| Stocks & ETFs (NVDA, TSLA, SPCX, AAPL, GOOGL, MSTR, GME, RDDT, HIMS, LLY, TTWO, QQQ, SLV) | Yahoo Finance chart API (fallback: Finnhub if `FINNHUB_API_KEY` is set) |

To add or remove a market, edit the list at the top of `data/markets.ts` — one line per market.

If every source fails, the card says "Live price unavailable" — no placeholder prices are ever shown.
Round pools, entries and the room's odds come from the round contract, so they read "Opens at launch" until it is deployed.

For the most reliable stock prices, create a free key at finnhub.io and add `FINNHUB_API_KEY` in Vercel → Settings → Environment Variables.

## Connecting the contracts later

| Replace | With |
|---|---|
| `getCurrentRound()` in `data/rounds.ts` | round contract reads / indexer (pools, entries, room odds) |
| `estimatePayout()` in `lib/scoring.ts` | the contract's real payout math |
| `stakingService` in `lib/web3/staking.ts` | real contract writes (e.g. viem `writeContract` + receipt) |
| `token.contractAddress` in `data/token.ts` | the real CA once live — every "Coming soon" updates automatically |

## Wallet behaviour

- **Connect Wallet** always lists **MetaMask, Coinbase Wallet and Trust Wallet**, plus any other wallet detected in the browser (EIP-6963), and shows the real shortened address and ETH balance once connected.
- **On phones**, tapping a wallet opens StockStakes inside that wallet app's browser (official deep links), where it connects normally. This needs a public URL — test it on your Vercel deployment, not `localhost`.
- On desktop, a wallet that isn't installed links to its download page.
- Users can also **Preview in demo mode** — clearly labelled, no address, no funds.
- **Place Stake** never fakes a transaction. Until contracts are live it returns "No transaction sent" with the reason.

## Environment variables (optional)

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_ROUND_MANAGER_ADDRESS=
NEXT_PUBLIC_STAKES_TOKEN_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=
```

Leave addresses empty until deployed. Social links (X, Telegram) are set in `data/site.ts` and show "Soon" until filled in.

## Brand assets

`brand/` holds ready-to-upload images for X (Twitter):

- `StockStakes-X-profile.png` — profile picture (2000×2000, fits the circle crop)
- `StockStakes-X-banner.png` — header banner (3000×1000)
- `StockStakes-logo-wordmark.png` — full logo, transparent background
