/** Long-form copy for /rules and /safety. Edit here, not in the pages. */

export const rulesPage = {
  eyebrow: "Round rules",
  title: "How a round works.",
  intro:
    "These are the rules StockStakes rounds are designed around. The deployed round contract is the final authority — when it is live, its address and source will be linked here.",
  note: "Round contracts are not live yet. Prices on the site are live, but no stakes can be placed until launch.",
  sections: [
    {
      title: "Rounds",
      body: [
        "A round runs for one hour. Each round lists a fixed set of markets, each with a yes/no question such as “Will ETH finish higher this hour?”.",
        "Entries are accepted while the round is Open. When the countdown reaches zero the round is Closed and no further entries or changes are possible.",
      ],
    },
    {
      title: "Your call",
      body: [
        "For each market you set a probability for YES between 0% and 100%. NO is always the remainder, so your call always sums to 100%.",
        "Stating 50% means you have no view. Moving away from 50% expresses conviction in one direction.",
      ],
    },
    {
      title: "Your stake",
      body: [
        "You choose how much ETH to stake behind a call. Staking requires a transaction that you review and approve in your own wallet.",
        "Minimum and maximum stakes are shown in the stake panel and enforced by the contract.",
      ],
    },
    {
      title: "Settlement",
      body: [
        "After the hour, the round is Settling while the outcome for each market is read from the predefined settlement source for that market.",
        "The settlement source and the exact measurement time are published before the round opens. Once the outcome is recorded on-chain the round is Settled.",
      ],
    },
    {
      title: "Scoring and rewards",
      body: [
        "Calls are scored on calibration: how close your probability was to what actually happened. A confident correct call scores well; a confident wrong call scores poorly.",
        "Better-calibrated calls earn from weaker calls in the same pool, according to the round’s published rules. Estimates shown before a round settles are illustrations only.",
      ],
    },
    {
      title: "Claims",
      body: [
        "Once a round is Settled, any amount owed to you can be claimed with a transaction from your wallet. The site will never show a reward as received until the chain confirms it.",
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
