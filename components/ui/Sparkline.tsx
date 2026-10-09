"use client";

import { useId, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/** Lightweight SVG sparkline with a draw-in animation and a live end point. */
export function Sparkline({
  data,
  width = 240,
  height = 64,
  positive = true,
  live = false,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  live?: boolean;
  className?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const { line, area, last } = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 4;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const area = `${line} L${width} ${height} L0 ${height} Z`;
    return { line, area, last: pts[pts.length - 1] };
  }, [data, width, height]);

  const color = positive ? "var(--accent)" : "var(--down)";

  const dotLeft = `${(last[0] / width) * 100}%`;
  const dotTop = `${(last[1] / height) * 100}%`;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`g${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill={`url(#g${gid})`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      {live && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute flex size-[7px] -translate-x-1/2 -translate-y-1/2"
          style={{ left: dotLeft, top: dotTop }}
        >
          <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ background: color }} />
          <span className="relative size-[7px] rounded-full" style={{ background: color }} />
        </span>
      )}
    </div>
  );
}
