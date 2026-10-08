import { contractsLive } from "./contracts";
import type { StakingService } from "./types";

/**
 * Staking service used by the UI.
 *
 * While contracts are not deployed this returns `unavailable` — it never
 * pretends a transaction was sent. Replace the body with real contract calls
 * (e.g. viem `writeContract` + `waitForTransactionReceipt`) and return
 * `submitted` / `confirmed` only from real receipts.
 */
export const stakingService: StakingService = {
  live: contractsLive,

  async enterRound(_roundId, _draft, session) {
    if (session.kind === "demo") {
      return {
        status: "unavailable",
        reason: "Demo mode — no transaction was sent. Connect a real wallet once staking is live.",
      };
    }
    return {
      status: "unavailable",
      reason: "Round contracts are not live yet. No transaction was sent and nothing left your wallet.",
    };
  },

  async claim() {
    return {
      status: "unavailable",
      reason: "Claims open once round contracts are live. Nothing to claim yet.",
    };
  },
};
