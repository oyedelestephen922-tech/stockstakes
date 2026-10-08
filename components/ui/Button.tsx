"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "gold";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent-solid text-accent-ink hover:shadow-[0_0_0_4px_var(--accent-soft),0_8px_30px_-6px_var(--glow)] hover:brightness-[1.04]",
  secondary: "border border-line-strong bg-panel text-fg hover:border-fg/40 hover:bg-panel-2",
  ghost: "text-fg-soft hover:bg-panel-2 hover:text-fg",
  gold: "border border-gold/40 bg-gold-soft text-gold hover:border-gold/70",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-[9px] px-3.5 text-[13px]",
  md: "h-11 rounded-[10px] px-5 text-[14px]",
  lg: "h-12 rounded-[11px] px-6 text-[15px]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
});

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </Link>
  );
}
