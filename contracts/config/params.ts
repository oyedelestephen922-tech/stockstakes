/**
 * Launch parameters. Edit here before deploying.
 *
 * Fixed at deploy (immutable in StakesOracle):
 *   challengeWindowSeconds, postDeadlineSeconds
 * Changeable later by the owner (with hard caps in the contracts):
 *   everything else.
 */
export const params = {
  // StakesOracle
  challengeWindowSeconds: 60 * 60, // a posted price waits 1h before it is final; the guardian can void it meanwhile
  postDeadlineSeconds: 6 * 60 * 60, // a price not posted within 6h of its hour is void → that round refunds
  maxDeviationBps: 300, // reject a keeper price more than 3% from the Chainlink feed
  maxFeedAgeSeconds: 26 * 60 * 60, // ignore Chainlink feeds older than their 24h heartbeat (+2h slack)

  // StakesRounds
  feeBps: 300, // 3% of profit (never of stake); hard cap 10%
  entryCutoffSeconds: 60, // entries close 1 minute before the round's hour starts
  minStakeEth: "0.001",
  maxStakeEth: "0.1", // keep low until the contracts have run live for a while; raise with setParams
} as const;
