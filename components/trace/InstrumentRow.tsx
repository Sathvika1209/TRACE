import * as React from "react";
import { cn } from "@/lib/utils";
import { SignificanceTier } from "./SignificanceIndicator";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface InstrumentRowProps {
  symbol: string;
  name: string;
  currentPrice: number;
  currency?: string;
  priceChangePercent: number;
  tier?: SignificanceTier;
  volumeRatio?: number;
  isStale?: boolean;
  onClick?: (symbol: string) => void;
  className?: string;
}

export function InstrumentRow({
  symbol,
  name,
  currentPrice,
  currency = "₹",
  priceChangePercent,
  tier = "NORMAL",
  volumeRatio,
  isStale = false,
  onClick,
  className,
}: InstrumentRowProps) {
  const isPositive = priceChangePercent >= 0;

  // Tier dot styling
  const tierDot = {
    NORMAL: "bg-border",
    NOTABLE: "bg-text-muted",
    SIGNIFICANT: "bg-brand-primary",
    MAJOR: "bg-brand-accent animate-pulse",
  }[tier];

  return (
    <div
      onClick={() => onClick?.(symbol)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(symbol);
        }
      }}
      className={cn(
        "group flex items-center justify-between px-3 py-2.5 rounded-[4px] border border-border-subtle bg-surface hover:bg-surface-hover hover:border-border transition-colors cursor-pointer select-none text-xs",
        className
      )}
    >
      {/* Symbol, Tier Indicator & Name */}
      <div className="flex items-center gap-2.5 min-w-0 pr-3">
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", tierDot)}
          title={`Significance tier: ${tier}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-text-primary uppercase tracking-tight">
              {symbol}
            </span>
            {isStale && (
              <span className="text-[10px] text-stale font-medium px-1 rounded bg-stale-surface">
                Stale
              </span>
            )}
          </div>
          <span className="text-[11px] text-text-muted truncate block max-w-[140px] sm:max-w-[200px]">
            {name}
          </span>
        </div>
      </div>

      {/* Subtle Sparkline Placeholder */}
      <div className="hidden md:flex items-center justify-center px-4 w-20 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
        <svg
          className="w-16 h-5 stroke-current overflow-visible"
          viewBox="0 0 64 20"
          fill="none"
          aria-hidden="true"
        >
          {isPositive ? (
            <path
              d="M2 16 L16 14 L30 15 L44 8 L62 4"
              className="text-positive stroke-[1.5]"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M2 4 L16 8 L30 6 L44 14 L62 17"
              className="text-negative stroke-[1.5]"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      {/* Price & Checkpoint Delta */}
      <div className="text-right shrink-0">
        <div className="font-mono font-semibold text-text-primary tabular-nums text-xs">
          {currency}{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-0.5 text-[11px] font-mono font-medium tabular-nums mt-0.5",
            isPositive ? "text-positive" : "text-negative"
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="h-3 w-3 shrink-0" aria-hidden="true" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {priceChangePercent.toFixed(2)}%
          </span>
          {volumeRatio && volumeRatio > 1.5 && (
            <span className="text-[10px] text-text-muted font-normal ml-1 hidden sm:inline">
              ({volumeRatio.toFixed(1)}x vol)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
