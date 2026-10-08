/**
 * Round timing derived from the clock: rounds run hour to hour and entries
 * close `bufferMinutes` before the top of the hour. When a contract is
 * connected, use its on-chain round id and close timestamp instead.
 */
const HOUR = 60 * 60 * 1000;

export function nextRoundClose(now: number, bufferMinutes = 0): number {
  const d = new Date(now);
  d.setMinutes(60 - bufferMinutes, 0, 0);
  let close = d.getTime();
  if (close <= now) close += HOUR;
  return close;
}

/** Round number = hours elapsed since the Unix epoch (UTC), so it is the same for everyone. */
export function roundNumberAt(now: number): number {
  return Math.floor(now / HOUR) + 1;
}
