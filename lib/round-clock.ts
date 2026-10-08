/**
 * Round timing derived from the clock: rounds run hour to hour and entries
 * close `bufferMinutes` before the top of the hour. When a contract is
 * connected, pass its on-chain close timestamp to `useCountdown` instead.
 */
export function nextRoundClose(now: number, bufferMinutes = 0): number {
  const d = new Date(now);
  d.setMinutes(60 - bufferMinutes, 0, 0);
  let close = d.getTime();
  if (close <= now) close += 60 * 60 * 1000;
  return close;
}
