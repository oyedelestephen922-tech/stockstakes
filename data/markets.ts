import type { LiveQuote, Market, MarketCategory } from "@/lib/types";

/**
 * Markets listed in each round. Add or remove a line here to change the board —
 * the round, prediction cards, stake panel and price feed all pick it up.
 *
 * Prices are filled live from /api/prices (see lib/prices.ts). Until the first
 * response arrives — or if every price source fails — `price` stays null and
 * the UI shows no price at all. No demo prices are ever used.
 */
interface MarketDef {
  id: string;
  symbol: string;
  name: string; // name shown on cards
  short?: string; // name used in the question, defaults to `name`
  kind: Market["kind"];
  category: MarketCategory;
  feed: Market["feed"];
}

/**
 * Every Robinhood Stock Token in the official registry (api.robinhood.com/rhj/assets),
 * plus ETH. The first FEATURED_COUNT entries are the headline markets: they lead the
 * board and appear in the scrolling price tape. The rest follow, grouped by category.
 */
const FEATURED_COUNT = 27;

const defs: MarketDef[] = [
  { id: "eth", symbol: "ETH", name: "Ethereum", short: "ETH", kind: "crypto", category: "Crypto", feed: { yahoo: "ETH-USD", coinbase: "ETH-USD" } },
  { id: "nvda", symbol: "NVDA", name: "NVIDIA", kind: "stock", category: "Chips", feed: { yahoo: "NVDA", finnhub: "NVDA" } },
  { id: "tsla", symbol: "TSLA", name: "Tesla", kind: "stock", category: "Consumer", feed: { yahoo: "TSLA", finnhub: "TSLA" } },
  { id: "spcx", symbol: "SPCX", name: "SpaceX", kind: "stock", category: "Space & Defense", feed: { yahoo: "SPCX", finnhub: "SPCX" } },
  { id: "aapl", symbol: "AAPL", name: "Apple", kind: "stock", category: "Tech", feed: { yahoo: "AAPL", finnhub: "AAPL" } },
  { id: "msft", symbol: "MSFT", name: "Microsoft", kind: "stock", category: "Tech", feed: { yahoo: "MSFT", finnhub: "MSFT" } },
  { id: "amzn", symbol: "AMZN", name: "Amazon", kind: "stock", category: "Tech", feed: { yahoo: "AMZN", finnhub: "AMZN" } },
  { id: "googl", symbol: "GOOGL", name: "Alphabet", kind: "stock", category: "Tech", feed: { yahoo: "GOOGL", finnhub: "GOOGL" } },
  { id: "meta", symbol: "META", name: "Meta Platforms", short: "Meta", kind: "stock", category: "Tech", feed: { yahoo: "META", finnhub: "META" } },
  { id: "pltr", symbol: "PLTR", name: "Palantir", kind: "stock", category: "Tech", feed: { yahoo: "PLTR", finnhub: "PLTR" } },
  { id: "amd", symbol: "AMD", name: "AMD", kind: "stock", category: "Chips", feed: { yahoo: "AMD", finnhub: "AMD" } },
  { id: "mstr", symbol: "MSTR", name: "Strategy", kind: "stock", category: "Crypto", feed: { yahoo: "MSTR", finnhub: "MSTR" } },
  { id: "nflx", symbol: "NFLX", name: "Netflix", kind: "stock", category: "Media", feed: { yahoo: "NFLX", finnhub: "NFLX" } },
  { id: "avgo", symbol: "AVGO", name: "Broadcom", kind: "stock", category: "Chips", feed: { yahoo: "AVGO", finnhub: "AVGO" } },
  { id: "tsm", symbol: "TSM", name: "Taiwan Semiconductor", short: "TSMC", kind: "stock", category: "Chips", feed: { yahoo: "TSM", finnhub: "TSM" } },
  { id: "mu", symbol: "MU", name: "Micron", kind: "stock", category: "Chips", feed: { yahoo: "MU", finnhub: "MU" } },
  { id: "intc", symbol: "INTC", name: "Intel", kind: "stock", category: "Chips", feed: { yahoo: "INTC", finnhub: "INTC" } },
  { id: "gme", symbol: "GME", name: "GameStop", kind: "stock", category: "Consumer", feed: { yahoo: "GME", finnhub: "GME" } },
  { id: "rddt", symbol: "RDDT", name: "Reddit", kind: "stock", category: "Media", feed: { yahoo: "RDDT", finnhub: "RDDT" } },
  { id: "hims", symbol: "HIMS", name: "Hims & Hers", kind: "stock", category: "Healthcare", feed: { yahoo: "HIMS", finnhub: "HIMS" } },
  { id: "lly", symbol: "LLY", name: "Eli Lilly", kind: "stock", category: "Healthcare", feed: { yahoo: "LLY", finnhub: "LLY" } },
  { id: "crwv", symbol: "CRWV", name: "CoreWeave", kind: "stock", category: "Tech", feed: { yahoo: "CRWV", finnhub: "CRWV" } },
  { id: "rklb", symbol: "RKLB", name: "Rocket Lab", kind: "stock", category: "Space & Defense", feed: { yahoo: "RKLB", finnhub: "RKLB" } },
  { id: "asts", symbol: "ASTS", name: "AST SpaceMobile", kind: "stock", category: "Space & Defense", feed: { yahoo: "ASTS", finnhub: "ASTS" } },
  { id: "crcl", symbol: "CRCL", name: "Circle", short: "Circle", kind: "stock", category: "Crypto", feed: { yahoo: "CRCL", finnhub: "CRCL" } },
  { id: "spy", symbol: "SPY", name: "SPDR S&P 500 ETF", short: "SPY", kind: "etf", category: "ETF", feed: { yahoo: "SPY", finnhub: "SPY" } },
  { id: "qqq", symbol: "QQQ", name: "Invesco QQQ", short: "QQQ", kind: "etf", category: "ETF", feed: { yahoo: "QQQ", finnhub: "QQQ" } },
  { id: "alab", symbol: "ALAB", name: "Astera Labs", kind: "stock", category: "Chips", feed: { yahoo: "ALAB", finnhub: "ALAB" } },
  { id: "aehr", symbol: "AEHR", name: "Aehr Test Systems", short: "Aehr", kind: "stock", category: "Chips", feed: { yahoo: "AEHR", finnhub: "AEHR" } },
  { id: "axti", symbol: "AXTI", name: "AXT", kind: "stock", category: "Chips", feed: { yahoo: "AXTI", finnhub: "AXTI" } },
  { id: "cbrs", symbol: "CBRS", name: "Cerebras", kind: "stock", category: "Chips", feed: { yahoo: "CBRS", finnhub: "CBRS" } },
  { id: "lrcx", symbol: "LRCX", name: "Lam Research", kind: "stock", category: "Chips", feed: { yahoo: "LRCX", finnhub: "LRCX" } },
  { id: "mtsi", symbol: "MTSI", name: "MACOM", kind: "stock", category: "Chips", feed: { yahoo: "MTSI", finnhub: "MTSI" } },
  { id: "mxl", symbol: "MXL", name: "MaxLinear", kind: "stock", category: "Chips", feed: { yahoo: "MXL", finnhub: "MXL" } },
  { id: "on", symbol: "ON", name: "ON Semiconductor", kind: "stock", category: "Chips", feed: { yahoo: "ON", finnhub: "ON" } },
  { id: "simo", symbol: "SIMO", name: "Silicon Motion", kind: "stock", category: "Chips", feed: { yahoo: "SIMO", finnhub: "SIMO" } },
  { id: "skhy", symbol: "SKHY", name: "SK hynix", kind: "stock", category: "Chips", feed: { yahoo: "SKHY", finnhub: "SKHY" } },
  { id: "sndk", symbol: "SNDK", name: "Sandisk", kind: "stock", category: "Chips", feed: { yahoo: "SNDK", finnhub: "SNDK" } },
  { id: "ter", symbol: "TER", name: "Teradyne", kind: "stock", category: "Chips", feed: { yahoo: "TER", finnhub: "TER" } },
  { id: "tsem", symbol: "TSEM", name: "Tower Semiconductor", kind: "stock", category: "Chips", feed: { yahoo: "TSEM", finnhub: "TSEM" } },
  { id: "vicr", symbol: "VICR", name: "Vicor", kind: "stock", category: "Chips", feed: { yahoo: "VICR", finnhub: "VICR" } },
  { id: "wdc", symbol: "WDC", name: "Western Digital", kind: "stock", category: "Chips", feed: { yahoo: "WDC", finnhub: "WDC" } },
  { id: "apld", symbol: "APLD", name: "Applied Digital", kind: "stock", category: "Tech", feed: { yahoo: "APLD", finnhub: "APLD" } },
  { id: "bb", symbol: "BB", name: "BlackBerry", kind: "stock", category: "Tech", feed: { yahoo: "BB", finnhub: "BB" } },
  { id: "cien", symbol: "CIEN", name: "Ciena", kind: "stock", category: "Tech", feed: { yahoo: "CIEN", finnhub: "CIEN" } },
  { id: "cls", symbol: "CLS", name: "Celestica", kind: "stock", category: "Tech", feed: { yahoo: "CLS", finnhub: "CLS" } },
  { id: "crm", symbol: "CRM", name: "Salesforce", kind: "stock", category: "Tech", feed: { yahoo: "CRM", finnhub: "CRM" } },
  { id: "crwd", symbol: "CRWD", name: "CrowdStrike", kind: "stock", category: "Tech", feed: { yahoo: "CRWD", finnhub: "CRWD" } },
  { id: "csco", symbol: "CSCO", name: "Cisco", kind: "stock", category: "Tech", feed: { yahoo: "CSCO", finnhub: "CSCO" } },
  { id: "dell", symbol: "DELL", name: "Dell", kind: "stock", category: "Tech", feed: { yahoo: "DELL", finnhub: "DELL" } },
  { id: "fico", symbol: "FICO", name: "Fair Isaac", short: "FICO", kind: "stock", category: "Tech", feed: { yahoo: "FICO", finnhub: "FICO" } },
  { id: "fig", symbol: "FIG", name: "Figma", kind: "stock", category: "Tech", feed: { yahoo: "FIG", finnhub: "FIG" } },
  { id: "glw", symbol: "GLW", name: "Corning", kind: "stock", category: "Tech", feed: { yahoo: "GLW", finnhub: "GLW" } },
  { id: "infq", symbol: "INFQ", name: "Infleqtion", kind: "stock", category: "Tech", feed: { yahoo: "INFQ", finnhub: "INFQ" } },
  { id: "intu", symbol: "INTU", name: "Intuit", kind: "stock", category: "Tech", feed: { yahoo: "INTU", finnhub: "INTU" } },
  { id: "oust", symbol: "OUST", name: "Ouster", kind: "stock", category: "Tech", feed: { yahoo: "OUST", finnhub: "OUST" } },
  { id: "p", symbol: "P", name: "Everpure", kind: "stock", category: "Tech", feed: { yahoo: "P", finnhub: "P" } },
  { id: "panw", symbol: "PANW", name: "Palo Alto Networks", short: "Palo Alto", kind: "stock", category: "Tech", feed: { yahoo: "PANW", finnhub: "PANW" } },
  { id: "qbts", symbol: "QBTS", name: "D-Wave Quantum", short: "D-Wave", kind: "stock", category: "Tech", feed: { yahoo: "QBTS", finnhub: "QBTS" } },
  { id: "rgti", symbol: "RGTI", name: "Rigetti Computing", short: "Rigetti", kind: "stock", category: "Tech", feed: { yahoo: "RGTI", finnhub: "RGTI" } },
  { id: "smci", symbol: "SMCI", name: "Super Micro Computer", short: "Super Micro", kind: "stock", category: "Tech", feed: { yahoo: "SMCI", finnhub: "SMCI" } },
  { id: "snow", symbol: "SNOW", name: "Snowflake", kind: "stock", category: "Tech", feed: { yahoo: "SNOW", finnhub: "SNOW" } },
  { id: "team", symbol: "TEAM", name: "Atlassian", kind: "stock", category: "Tech", feed: { yahoo: "TEAM", finnhub: "TEAM" } },
  { id: "wday", symbol: "WDAY", name: "Workday", kind: "stock", category: "Tech", feed: { yahoo: "WDAY", finnhub: "WDAY" } },
  { id: "wyfi", symbol: "WYFI", name: "WhiteFiber", kind: "stock", category: "Tech", feed: { yahoo: "WYFI", finnhub: "WYFI" } },
  { id: "sats", symbol: "SATS", name: "EchoStar", kind: "stock", category: "Media", feed: { yahoo: "SATS", finnhub: "SATS" } },
  { id: "snap", symbol: "SNAP", name: "Snap", kind: "stock", category: "Media", feed: { yahoo: "SNAP", finnhub: "SNAP" } },
  { id: "ttwo", symbol: "TTWO", name: "Take-Two", kind: "stock", category: "Media", feed: { yahoo: "TTWO", finnhub: "TTWO" } },
  { id: "baba", symbol: "BABA", name: "Alibaba", kind: "stock", category: "Consumer", feed: { yahoo: "BABA", finnhub: "BABA" } },
  { id: "ccl", symbol: "CCL", name: "Carnival", kind: "stock", category: "Consumer", feed: { yahoo: "CCL", finnhub: "CCL" } },
  { id: "cvna", symbol: "CVNA", name: "Carvana", kind: "stock", category: "Consumer", feed: { yahoo: "CVNA", finnhub: "CVNA" } },
  { id: "elf", symbol: "ELF", name: "e.l.f. Beauty", short: "e.l.f.", kind: "stock", category: "Consumer", feed: { yahoo: "ELF", finnhub: "ELF" } },
  { id: "lulu", symbol: "LULU", name: "Lululemon", kind: "stock", category: "Consumer", feed: { yahoo: "LULU", finnhub: "LULU" } },
  { id: "clov", symbol: "CLOV", name: "Clover Health", kind: "stock", category: "Healthcare", feed: { yahoo: "CLOV", finnhub: "CLOV" } },
  { id: "mrna", symbol: "MRNA", name: "Moderna", kind: "stock", category: "Healthcare", feed: { yahoo: "MRNA", finnhub: "MRNA" } },
  { id: "sls", symbol: "SLS", name: "SELLAS Life Sciences", short: "SELLAS", kind: "stock", category: "Healthcare", feed: { yahoo: "SLS", finnhub: "SLS" } },
  { id: "tem", symbol: "TEM", name: "Tempus AI", kind: "stock", category: "Healthcare", feed: { yahoo: "TEM", finnhub: "TEM" } },
  { id: "unh", symbol: "UNH", name: "UnitedHealth", kind: "stock", category: "Healthcare", feed: { yahoo: "UNH", finnhub: "UNH" } },
  { id: "bull", symbol: "BULL", name: "Webull", kind: "stock", category: "Finance", feed: { yahoo: "BULL", finnhub: "BULL" } },
  { id: "fisv", symbol: "FISV", name: "Fiserv", kind: "stock", category: "Finance", feed: { yahoo: "FISV", finnhub: "FISV" } },
  { id: "futu", symbol: "FUTU", name: "Futu", kind: "stock", category: "Finance", feed: { yahoo: "FUTU", finnhub: "FUTU" } },
  { id: "nu", symbol: "NU", name: "Nu Holdings", short: "Nu", kind: "stock", category: "Finance", feed: { yahoo: "NU", finnhub: "NU" } },
  { id: "clsk", symbol: "CLSK", name: "CleanSpark", kind: "stock", category: "Crypto", feed: { yahoo: "CLSK", finnhub: "CLSK" } },
  { id: "glxy", symbol: "GLXY", name: "Galaxy Digital", short: "Galaxy", kind: "stock", category: "Crypto", feed: { yahoo: "GLXY", finnhub: "GLXY" } },
  { id: "iren", symbol: "IREN", name: "IREN", kind: "stock", category: "Crypto", feed: { yahoo: "IREN", finnhub: "IREN" } },
  { id: "ceg", symbol: "CEG", name: "Constellation Energy", kind: "stock", category: "Energy", feed: { yahoo: "CEG", finnhub: "CEG" } },
  { id: "nne", symbol: "NNE", name: "Nano Nuclear Energy", short: "Nano Nuclear", kind: "stock", category: "Energy", feed: { yahoo: "NNE", finnhub: "NNE" } },
  { id: "pr", symbol: "PR", name: "Permian Resources", kind: "stock", category: "Energy", feed: { yahoo: "PR", finnhub: "PR" } },
  { id: "run", symbol: "RUN", name: "Sunrun", kind: "stock", category: "Energy", feed: { yahoo: "RUN", finnhub: "RUN" } },
  { id: "vst", symbol: "VST", name: "Vistra", kind: "stock", category: "Energy", feed: { yahoo: "VST", finnhub: "VST" } },
  { id: "fix", symbol: "FIX", name: "Comfort Systems", kind: "stock", category: "Industrials", feed: { yahoo: "FIX", finnhub: "FIX" } },
  { id: "ge", symbol: "GE", name: "General Electric", short: "GE", kind: "stock", category: "Industrials", feed: { yahoo: "GE", finnhub: "GE" } },
  { id: "mod", symbol: "MOD", name: "Modine", kind: "stock", category: "Industrials", feed: { yahoo: "MOD", finnhub: "MOD" } },
  { id: "powl", symbol: "POWL", name: "Powell Industries", short: "Powell", kind: "stock", category: "Industrials", feed: { yahoo: "POWL", finnhub: "POWL" } },
  { id: "ups", symbol: "UPS", name: "UPS", kind: "stock", category: "Industrials", feed: { yahoo: "UPS", finnhub: "UPS" } },
  { id: "usar", symbol: "USAR", name: "USA Rare Earth", kind: "stock", category: "Industrials", feed: { yahoo: "USAR", finnhub: "USAR" } },
  { id: "ba", symbol: "BA", name: "Boeing", kind: "stock", category: "Space & Defense", feed: { yahoo: "BA", finnhub: "BA" } },
  { id: "fly", symbol: "FLY", name: "Firefly Aerospace", short: "Firefly", kind: "stock", category: "Space & Defense", feed: { yahoo: "FLY", finnhub: "FLY" } },
  { id: "lhx", symbol: "LHX", name: "L3Harris", kind: "stock", category: "Space & Defense", feed: { yahoo: "LHX", finnhub: "LHX" } },
  { id: "lmt", symbol: "LMT", name: "Lockheed Martin", kind: "stock", category: "Space & Defense", feed: { yahoo: "LMT", finnhub: "LMT" } },
  { id: "rcat", symbol: "RCAT", name: "Red Cat", kind: "stock", category: "Space & Defense", feed: { yahoo: "RCAT", finnhub: "RCAT" } },
  { id: "bnd", symbol: "BND", name: "Vanguard Total Bond ETF", short: "BND", kind: "etf", category: "ETF", feed: { yahoo: "BND", finnhub: "BND" } },
  { id: "ewy", symbol: "EWY", name: "iShares MSCI South Korea", short: "EWY", kind: "etf", category: "ETF", feed: { yahoo: "EWY", finnhub: "EWY" } },
  { id: "gld", symbol: "GLD", name: "SPDR Gold Trust", short: "Gold (GLD)", kind: "etf", category: "ETF", feed: { yahoo: "GLD", finnhub: "GLD" } },
  { id: "sgov", symbol: "SGOV", name: "iShares 0-3M Treasury", short: "SGOV", kind: "etf", category: "ETF", feed: { yahoo: "SGOV", finnhub: "SGOV" } },
  { id: "slv", symbol: "SLV", name: "iShares Silver Trust", short: "Silver (SLV)", kind: "etf", category: "ETF", feed: { yahoo: "SLV", finnhub: "SLV" } },
  { id: "vti", symbol: "VTI", name: "Vanguard Total Stock Market", short: "VTI", kind: "etf", category: "ETF", feed: { yahoo: "VTI", finnhub: "VTI" } },
];

export const markets: Market[] = defs.map((d, i) => ({
  id: d.id,
  symbol: d.symbol,
  name: d.name,
  pair: `${d.symbol} / USD`,
  category: d.category,
  kind: d.kind,
  featured: i < FEATURED_COUNT,
  price: null,
  changePct: null,
  changeWindow: "1h",
  history: [],
  marketState: null,
  feed: d.feed,
  question: `Will ${d.short ?? d.name} finish higher this hour?`,
  source: "api",
}));

/** Categories for filter chips, in a fixed reading order. */
const CATEGORY_ORDER: MarketCategory[] = [
  "Crypto", "Tech", "Chips", "Consumer", "Media", "Healthcare", "Finance", "Energy", "Industrials", "Space & Defense", "ETF",
];
export const marketCategories: MarketCategory[] = CATEGORY_ORDER.filter((c) => markets.some((m) => m.category === c));

export function getMarkets(): Market[] {
  return markets;
}

export function getMarket(id: string): Market | undefined {
  return markets.find((m) => m.id === id);
}

/** Merge live quotes into the market list. Markets without a quote keep price null. */
export function withQuotes(list: Market[], quotes: Record<string, LiveQuote | null>): Market[] {
  return list.map((m) => {
    const q = quotes[m.id];
    if (!q) return m;
    return {
      ...m,
      price: q.price,
      changePct: q.changePct,
      changeWindow: q.changeWindow,
      history: q.history,
      marketState: q.marketState,
    };
  });
}
