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
  rounds.ts          pre-launch round config and stake presets
  token.ts           $STAKES info — contractAddress is null (CA Coming Soon)
  site.ts            nav, hero copy, steps, thesis, safety copy
  legal.ts           /rules and /safety page content
lib/
  prices.ts          live price feed (Coinbase, Yahoo Finance, optional Finnhub)
  scoring.ts         illustrative payout estimate (used only before launch)
  round-clock.ts     hourly close time
  web3/              chain + contract config, staking/claim transactions, wallet list, EIP-6963
providers/           theme, wallet, live-markets and live-round context
contracts/           Solidity contracts, tests, deploy script, price keeper (see its README)
hooks/               useCountdown, usePayoutQuote, useMyEntries
```

## Live data

Prices are live. `GET /api/prices` fetches them on the server and the page refreshes every 30 seconds.

StockStakes lists **107 markets**: every active Robinhood Stock Token from the official registry (`api.robinhood.com/rhj/assets`, the same source getstock.fun uses) plus ETH.

| Market | Source |
|---|---|
| ETH | Coinbase Exchange public candles (fallback: Yahoo Finance) |
| Stocks & ETFs | Yahoo Finance spark, batched 20 per request → Yahoo chart per symbol for any gaps → Finnhub (if `FINNHUB_API_KEY` is set) |

Prices are cached on the server for 25 seconds, so all 107 load with about 9 upstream requests no matter how many people are on the site.

To add or remove a market, edit the list in `data/markets.ts` — one line per market. The first 27 lines are the "Popular" markets shown first and in the scrolling price tape.

If every source fails, the card says "Live price unavailable" — no placeholder prices are ever shown.
Round pools, entries and the room's odds come from the round contract, so they read "Opens at launch" until it is deployed.

For the most reliable stock prices, create a free key at finnhub.io and add `FINNHUB_API_KEY` in Vercel → Settings → Environment Variables.

## Contracts

Staking runs on two contracts on Robinhood Chain — `StakesRounds` (stakes, payouts, claims) and `StakesOracle` (hourly prices posted by a keeper on GitHub Actions). They live in [`contracts/`](contracts/), with tests, the deploy script and the keeper.

**To deploy, follow [contracts/README.md](contracts/README.md)** — step by step for Windows Command Prompt.

Until the deploy script has written `lib/web3/deployment.ts`, the site stays in pre-launch mode ("Opens at launch", no transactions). After deployment it reads pools and odds from the chain, places real stakes, quotes exact payouts, and lists your entries with Claim buttons.

## Wallet behaviour

- **Connect Wallet** always lists **MetaMask, Coinbase Wallet and Trust Wallet**, plus any other wallet detected in the browser (EIP-6963), and shows the real shortened address and ETH balance once connected.
- **On phones**, tapping a wallet opens StockStakes inside that wallet app's browser (official deep links), where it connects normally. This needs a public URL — test it on your Vercel deployment, not `localhost`.
- On desktop, a wallet that isn't installed links to its download page.
- Users can also **Preview in demo mode** — clearly labelled, no address, no funds.
- **Place Stake** never fakes a transaction: it switches the wallet to Robinhood Chain, checks the stake against the contract first, and shows success only from a confirmed receipt. Before launch it returns "No transaction sent" with the reason.

## Environment variables (optional)

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_CHAIN_ID=            # 4663 (default) = Robinhood Chain mainnet
NEXT_PUBLIC_RPC_URL=             # optional private RPC for reads
NEXT_PUBLIC_STAKES_TOKEN_ADDRESS=
FINNHUB_API_KEY=
```

Contract addresses are not env vars — they come from `lib/web3/deployment.ts`, written by the deploy script. Social links (X, Telegram) are set in `data/site.ts` and show "Soon" until filled in.

## Brand assets

`brand/` holds ready-to-upload images for X (Twitter):

- `StockStakes-X-profile.png` — profile picture (2000×2000, fits the circle crop)
- `StockStakes-X-banner.png` — header banner (3000×1000)
- `StockStakes-logo-wordmark.png` — full logo, transparent background
