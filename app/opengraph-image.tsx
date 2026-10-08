import { ImageResponse } from "next/og";

export const alt = "StockStakes — Make Your Call. Put Your Stake Behind It.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#060708",
          backgroundImage:
            "linear-gradient(rgba(243,239,230,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(243,239,230,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          color: "#f3efe6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
            <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="8.5" fill="#121519" stroke="#2a2f36" />
            <circle cx="16" cy="16" r="11" stroke="#2a2f36" strokeWidth="1.6" />
            <circle
              cx="16"
              cy="16"
              r="11"
              stroke="#ff4757"
              strokeWidth="1.8"
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
              strokeDasharray="69.115"
              strokeDashoffset="19.35"
            />
            <path d="M9.5 20.2 L13 16.6 L16 18.6 L21.4 12.6" stroke="#f3efe6" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="21.4" y1="12.6" x2="21.4" y2="22.6" stroke="#d9b26a" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="19.6" y="8.4" width="3.6" height="3.6" rx="0.6" fill="#d9b26a" transform="rotate(45 21.4 10.2)" />
          </svg>
          <div style={{ display: "flex", fontSize: 40, letterSpacing: -1.5 }}>
            <span style={{ color: "#c9c5bc" }}>Stock</span>
            <span style={{ fontWeight: 700 }}>Stakes</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
          <span>Make your call.</span>
          <span style={{ color: "#c9c5bc" }}>
            Put your&nbsp;<span style={{ color: "#ff4757" }}>stake</span>&nbsp;behind it.
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#7d838c" }}>
          <span>Hourly rounds · On-chain settlement</span>
          <span style={{ color: "#d9b26a" }}>$STAKES</span>
        </div>
      </div>
    ),
    size,
  );
}
