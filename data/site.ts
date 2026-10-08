/**
 * Site-wide copy and navigation. Keeping copy here avoids repeated hardcoded UI.
 */

export const site = {
  name: "StockStakes",
  ticker: "$STAKES",
  tagline: "Make your call. Put your stake behind it.",
  title: "StockStakes — Make Your Call. Put Your Stake Behind It.",
  description:
    "StockStakes is an on-chain prediction platform where you set market probabilities, stake ETH behind your conviction, and compete to make better-calibrated calls.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://stockstakes.fun",
  social: {
    // Set these when the accounts exist. Null links render as "coming soon".
    x: null as string | null,
    telegram: null as string | null,
  },
};

export const navLinks = [
  { label: "Play", href: "/#play" },
  { label: "Markets", href: "/#markets" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Safety", href: "/#safety" },
  { label: "$STAKES", href: "/#token" },
] as const;

export const footerLinks = [
  { label: "Play", href: "/#play" },
  { label: "Markets", href: "/#markets" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Rules", href: "/rules" },
  { label: "Safety", href: "/safety" },
  { label: "$STAKES", href: "/#token" },
] as const;

export const hero = {
  status: "Hourly rounds · On-chain settlement",
  headline: ["Make your call.", "Put your stake behind it."],
  body: "StockStakes turns market predictions into hourly on-chain rounds. Set your probabilities, stake ETH behind your conviction, and earn when your predictions outperform the room.",
  secondary:
    "Every round asks what happens next across major markets. You decide the probabilities. Your stake follows your conviction. The chain handles settlement.",
  primaryCta: { label: "Enter the Round", href: "/#play" },
  secondaryCta: { label: "How It Works", href: "/#how-it-works" },
};

export const steps = [
  {
    n: "01",
    title: "Call",
    body: "Choose the outcome you believe is most likely and assign probabilities.",
  },
  {
    n: "02",
    title: "Stake",
    body: "Put ETH behind your conviction before the round closes.",
  },
  {
    n: "03",
    title: "Settle",
    body: "The round evaluates the market outcome using predefined on-chain settlement data.",
  },
  {
    n: "04",
    title: "Claim",
    body: "Better-calibrated predictions earn from weaker predictions according to the round's rules.",
  },
] as const;

export const thesis = {
  title: "Conviction has a price.",
  paragraphs: [
    "StockStakes is built around one simple idea: predictions mean more when you have something behind them.",
    "Every round lets you express your view with probabilities and put ETH behind that conviction. The goal isn't to guess randomly. It's to consistently make better-calibrated calls than the room.",
  ],
  features: [
    {
      key: "calibration",
      title: "Calibration",
      body: "Turn market intuition into measurable probabilities.",
    },
    {
      key: "conviction",
      title: "Conviction",
      body: "Your stake reflects how strongly you believe in your call.",
    },
    {
      key: "settlement",
      title: "Settlement",
      body: "Rules and outcomes are designed to be transparent and verifiable.",
    },
  ],
} as const;

export const safety = {
  title: "Know what you're staking on.",
  intro:
    "Staking ETH carries real risk. Here is what StockStakes commits to — and what you should expect from any prediction platform.",
  principles: [
    {
      key: "rules",
      title: "Transparent rules",
      body: "How rounds work, how calls are scored and how pools are split is written down before you stake.",
    },
    {
      key: "timing",
      title: "Visible timing",
      body: "Every round shows exactly when entries close and when settlement happens.",
    },
    {
      key: "settlement",
      title: "Explained settlement",
      body: "The price source and the moment a round is measured are defined up front, not after the fact.",
    },
    {
      key: "approval",
      title: "Explicit approval",
      body: "Nothing leaves your wallet without a transaction you review and sign yourself.",
    },
    {
      key: "returns",
      title: "No guaranteed returns",
      body: "You can lose your stake. Estimates on this site are illustrations, never promises.",
    },
    {
      key: "confirmations",
      title: "No fake confirmations",
      body: "A stake, settlement or reward is only shown as complete when the chain confirms it.",
    },
    {
      key: "addresses",
      title: "No invented addresses",
      body: "The $STAKES contract address appears here only once it is live. Until then: CA Coming Soon.",
    },
  ],
} as const;
