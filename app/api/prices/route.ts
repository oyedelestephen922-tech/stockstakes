import { getMarkets } from "@/data/markets";
import { getQuotes } from "@/lib/prices";

/**
 * GET /api/prices — live quotes for every market on the board.
 * Cached briefly at the edge so many visitors share one upstream request.
 */
export async function GET() {
  const quotes = await getQuotes(getMarkets());
  return Response.json(
    { updatedAt: new Date().toISOString(), quotes },
    { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" } },
  );
}
