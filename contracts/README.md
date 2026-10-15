# StockStakes contracts

Two contracts on Robinhood Chain (chain 4663), plus the hourly price keeper.

| Contract | What it does |
|---|---|
| `StakesRounds` | Takes stakes, splits each market's pool by stake × Brier score, pays claims and refunds. |
| `StakesOracle` | Holds the hourly prices the keeper posts. Checks them against Chainlink where a feed exists, makes each wait 1 hour before it is final (the guardian can void it meanwhile), and voids any price not posted within 6 hours. |

The rules players see are on the site's `/rules` page (`data/legal.ts`) and match these contracts.

**Not audited.** The contracts have unit, fuzz and invariant tests (`npm test`), but no independent audit. Keep the stake cap low (`maxStakeEth` in `config/params.ts`, default 0.1 ETH) until they have run for a while.

---

## Deploy to mainnet (Windows Command Prompt)

### 1. Prepare two wallets

| Wallet | Role | Needs |
|---|---|---|
| **Deployer** | Deploys and **owns** the contracts (pause entries, change limits, withdraw fees). Also the **guardian** (voids bad prices) unless you set another. | ETH on Robinhood Chain for gas — 0.01 ETH is plenty. |
| **Keeper** | Posts prices every hour from GitHub. Can do nothing else. | ~0.01 ETH for gas, topped up now and then. |

Use a fresh wallet for each. Never share or paste a private key anywhere except the two places below.

### 2. Check the launch settings

Open `contracts\config\params.ts`. Defaults: fee 3% of profit, stakes 0.001–0.1 ETH, entries close 1 minute before the hour, prices final after 1 hour, void if missing after 6 hours. The last two are fixed forever at deploy; the rest the owner can change later.

### 3. Install and test

```bat
cd C:\Users\HP\Downloads\dev\stockstakes
git checkout contracts
git pull
cd contracts
npm install
npm test
```

`npm test` should end with `50 passing`.

### 4. Add your keys

```bat
copy .env.example .env
notepad .env
```

Fill in and save:

```
DEPLOYER_PRIVATE_KEY=0x...your deployer wallet's private key...
KEEPER_ADDRESS=0x...your keeper wallet's ADDRESS (not its key)...
```

Optional: `GUARDIAN_ADDRESS`, `OWNER_ADDRESS` (default to the deployer), and `ROBINHOOD_RPC_URL` (a private RPC such as Alchemy is more reliable than the public one). `.env` is git-ignored — it never leaves your PC.

### 5. Deploy

```bat
cd ..
npm run deploy:contracts
```

It prints a summary (wallets, balance, markets, limits) and asks you to **type `DEPLOY`**. Then it:

1. deploys `StakesOracle` and `StakesRounds`
2. attaches the 30 Chainlink check feeds (each checked on-chain first)
3. lists all 107 markets
4. verifies both contracts on Blockscout

**If it stops part-way** (network error, closed window), run `npm run deploy:contracts` again. It reads what is already on-chain and continues — it never deploys twice. If only verification failed, the contracts work; re-run later to retry it.

It writes three files: `contracts\deployments\4663.json`, `lib\web3\deployment.ts`, `lib\web3\abis.ts`.

### 6. Set up the keeper on GitHub

On github.com → the `stockstakes` repo → **Settings → Secrets and variables → Actions**:

- **New repository secret** `KEEPER_PRIVATE_KEY` = the keeper wallet's private key
- Optional secret `RPC_URL` = a private RPC URL

Send the keeper wallet about **0.01 ETH** on Robinhood Chain.

### 7. Publish

```bat
git add contracts\deployments\4663.json lib\web3\deployment.ts lib\web3\abis.ts
git commit -m "Deploy StockStakes contracts to Robinhood Chain"
git push
```

Then merge the `contracts` branch into `main` (on GitHub: open a pull request from `contracts` and merge it). Merging does two things:

- **Vercel redeploys** the site with staking switched on.
- **The keeper schedule starts.** GitHub only runs schedules on `main`.

### 8. Check the keeper

On GitHub → **Actions → Keeper → Run workflow** (leave "Dry run" unticked). Open the run's log. You should see `Posted hour …` lines and a summary like `posted 30+`. After that it runs by itself every hour at about :04.

- Stocks only have prices when something traded just before the hour (US pre-market through after-hours on weekdays). Outside those times, stock rounds refund — that's expected.
- **ETH trades 24/7.** If a run says *"No ETH price for the latest hour"*, the price sources are failing — check the log.
- GitHub emails you when a run fails (failed transaction, empty keeper wallet, no ETH price).

---

## Running it day to day

Once verified, both contracts have a **Write contract** tab on Blockscout (search the address on the explorer, connect the owner/guardian wallet).

| Task | Contract → function | Who |
|---|---|---|
| Stop new entries (claims keep working) | `StakesRounds.setPaused(true)` | owner |
| Change fee / stake limits | `StakesRounds.setParams(feeBps, entryCutoff, minStake, maxStake)` — stakes in wei | owner |
| Withdraw fees | `StakesRounds.withdrawFees(to)` | owner |
| Void a bad price (within 1h of posting) | `StakesOracle.voidPrices(hour, [market keys])` | guardian |
| Change the keeper wallet | `StakesOracle.setKeeper(address)` | owner |

A market key is the market id as bytes32, e.g. `nvda` → `0x6e76646100000000000000000000000000000000000000000000000000000000`. An hour is unix time ÷ 3600.

The owner can **never** move players' stakes — only accrued fees.

---

## Developer notes

```bat
npm test                 :: Solidity + keeper tests
npm run typecheck
npm run fork:node        :: local node that copies Robinhood Chain mainnet
npm run deploy:local     :: rehearse the deploy against it (second window)
npm run export:site      :: rewrite lib\web3\deployment.ts and abis.ts
```

- `config/markets.ts` reads the market list from the site's `data/markets.ts` — one source of truth. To add markets after launch, add them there and re-run the deploy (it lists only the new ones).
- `config/chainlink.ts` holds the Chainlink feed addresses (snapshot of Chainlink's Robinhood Chain list).
- `keeper/` is plain TypeScript run with Node 24 (`node keeper/run.ts`); `DRY_RUN=1` fetches without sending.
