import { clamp } from "./format";

/**
 * ILLUSTRATIVE reward model used for on-screen estimates only.
 *
 * Calls are scored with a Brier-style rule: score = 1 − (p − outcome)².
 * A call that scores better than the room's average call earns a larger share
 * of the pool; a weaker call earns less. The real split is defined by the
 * round contract — swap `estimatePayout` for a contract/indexer quote then.
 */

const SPREAD = 2; // how strongly calibration edge moves the payout

export function brierScore(probYes: number, outcomeYes: boolean): number {
  const p = clamp(probYes, 0, 100) / 100;
  const o = outcomeYes ? 1 : 0;
  return 1 - (p - o) ** 2;
}

export interface PayoutEstimate {
  ifYes: number;
  ifNo: number;
  /** Payout in the outcome the user leans toward. */
  favoured: number;
  favouredSide: "YES" | "NO";
}

export function estimatePayout(
  probYes: number,
  stakeEth: number,
  crowdYes: number,
): PayoutEstimate {
  const calc = (outcome: boolean) => {
    const edge = brierScore(probYes, outcome) - brierScore(crowdYes, outcome);
    const multiplier = clamp(1 + edge * SPREAD, 0, 3);
    return stakeEth * multiplier;
  };
  const ifYes = calc(true);
  const ifNo = calc(false);
  const favouredSide = probYes >= 50 ? "YES" : "NO";
  return { ifYes, ifNo, favoured: favouredSide === "YES" ? ifYes : ifNo, favouredSide };
}
