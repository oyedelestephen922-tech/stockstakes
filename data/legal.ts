/** Long-form copy for /rules and /safety. Edit here, not in the pages. */

export const rulesPage = {
  eyebrow: "Round rules",
  title: "How a round works.",
  intro:
    "These are the rules the StockStakes round contracts enforce. The deployed contracts are the final authority — their addresses are listed at the end of this page once they are live, with verified source code on the block explorer.",
  note: "Round contracts are not live yet. Prices on the site are live, but no stakes can be placed until launch.",
  sections: [
    {
      title: "Rounds",
      body: [
        "Each round covers one hour of price movement, from the top of one hour to the top of the next (UTC). Every market asks the same question: will it finish the hour higher than it started?",
        "You call the next hour. While one hour is under way, the site takes entries for the round that starts at the top of the next hour. Entries close one minute before that round starts, so nobody can enter once its move has begun.",
      ],
    },
    {
      title: "Your call",
      body: [
        "For each market you set a probability for YES (higher) between 0% and 100%. NO is always the remainder.",
        "Stating 50% means you have no view. Moving away from 50% expresses conviction in one direction. One call per market per round per wallet.",
      ],
    },
    {
      title: "Your stake",
      body: [
        "You choose how much ETH to stake behind a call. Staking is a transaction on Robinhood Chain that you review and approve in your own wallet.",
        "Minimum and maximum stakes are shown in the stake panel and enforced by the contract.",
      ],
    },
    {
      title: "Prices",
      body: [
        "The price of each market at the top of every hour is posted on-chain by the StockStakes keeper, from public market data (Coinbase for ETH, Yahoo Finance for stocks): the close of the last one-minute candle before the hour. If nothing traded in the six minutes before the hour, no price is posted.",
        "Where Chainlink publishes a price feed for the market, the contract rejects a posted price more than 3% away from it. Each posted price then waits one hour before it is final; during that window a bad price can be voided, which refunds the round. A price can never be changed after it is posted.",
      ],
    },
    {
      title: "Scoring and payouts",
      body: [
        "Calls are scored with the Brier rule: score = 1 − (your probability − outcome)², where the outcome is 100% if the market finished higher and 0% if lower. A confident correct call scores close to 1; a confident wrong call scores close to 0.",
        "Each market's pool is split between everyone in it in proportion to stake × score. A call better calibrated than the rest of the pool gets back more than it staked; a worse one gets back less. If everyone makes the same call, everyone gets their stake back.",
      ],
    },
    {
      title: "Fee",
      body: [
        "A protocol fee (currently 3%) is taken from profit only — never from your own stake. If you get back less than or exactly what you staked, you pay no fee. The fee for a round is fixed when its first entry is made, and can never exceed 10%.",
      ],
    },
    {
      title: "Refunds",
      body: [
        "Every stake in a market is returned in full if the price did not change over the hour, if either price was voided, if no price was posted within six hours (for example when a stock market was closed and nothing traded), or if no call in the pool scored above zero.",
      ],
    },
    {
      title: "Claims",
      body: [
        "Once both prices for a round are final, your payout or refund can be claimed with a transaction from your wallet — under Your entries on the home page. Unclaimed payouts stay claimable; they never expire.",
        "The site never shows a reward as received until the chain confirms it.",
      ],
    },
  ],
};

export const safetyPage = {
  eyebrow: "Safety",
  title: "Know what you're staking on.",
  intro:
    "Prediction markets involve real money and real risk. Here is how StockStakes is built to keep you informed, and what you should check before staking anywhere.",
  sections: [
    {
      title: "You can lose your stake",
      body: [
        "Nothing on StockStakes is a guaranteed return. Only stake what you can afford to lose. Payout figures shown before settlement are estimates from current round data and can change.",
      ],
    },
    {
      title: "Every transaction needs your approval",
      body: [
        "StockStakes cannot move funds from your wallet. Each stake or claim opens a request in your wallet that you can read, approve or reject.",
        "StockStakes will never ask for your seed phrase or private key. Anyone who does is not us.",
      ],
    },
    {
      title: "No fake confirmations",
      body: [
        "The interface only shows a stake as placed, a round as settled, or a reward as received when that is confirmed on-chain. Until then you will see statuses like Pending, Settling or Not live.",
      ],
    },
    {
      title: "Live data, clearly sourced",
      body: [
        "Prices on StockStakes are live market data from public feeds (Coinbase for ETH, Yahoo Finance for stocks) and can be delayed. Round pools, entries and the room's odds are shown only once the round contract is live — never as placeholder numbers.",
      ],
    },
    {
      title: "Who sets the settlement price",
      body: [
        "Hourly prices are posted by the StockStakes keeper, not by a fully decentralised oracle. The contracts limit what it can do: prices are checked against Chainlink where a feed exists, wait an hour before they are final, can never be changed once posted, and a missing price refunds the round. The keeper, and the StockStakes team, can never move staked funds.",
        "The round contracts are tested but have not been independently audited. Stakes are capped while they prove themselves.",
      ],
    },
    {
      title: "The $STAKES contract address",
      body: [
        "The $STAKES token is not live yet, so there is no contract address. It will be published on this site only when the token launches.",
        "Treat any “$STAKES” address you see elsewhere before then as unofficial.",
      ],
    },
    {
      title: "Check the rules first",
      body: [
        "Read how rounds open, close, settle and pay out before you stake. If something is unclear, don’t stake until it is.",
      ],
    },
  ],
};
