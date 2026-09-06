import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignificanceIndicator, SignificanceTier } from "./SignificanceIndicator";
import { FreshnessStatus, FreshnessType } from "./FreshnessStatus";
import { ArrowUpRight, ArrowDownRight, ChevronRight, CheckCircle2 } from "lucide-react";

export interface ChangeReasonItem {
  code: string;
  description: string;
  magnitude?: number;
}

export interface ChangeInsightProps {
  tier: SignificanceTier;
  symbol: string;
  name: string;
  currentPrice: number;
  currency?: string;
  priceChangePercent: number; // e.g. +4.82
  priceChangeAbsolute?: number; // e.g. +48.50
  benchmarkName?: string; // e.g. "NIFTY 50"
  relativePerformancePercent?: number; // e.g. +3.95
  volumeRatio?: number; // e.g. 2.8
  reasons: ChangeReasonItem[];
  checkpointTimeAgo: string; // e.g. "Since 10:15 AM (3h ago)"
  freshnessStatus?: FreshnessType;
  lastUpdated?: string;
  significanceScore?: number;
  onViewDetails?: (symbol: string) => void;
  className?: string;
}

export function ChangeInsight({
  tier,
  symbol,
  name,
  currentPrice,
  currency = "₹",
  priceChangePercent,
  priceChangeAbsolute,
  benchmarkName = "NIFTY 50",
  relativePerformancePercent,
  volumeRatio,
  reasons,
  checkpointTimeAgo,
  freshnessStatus = "FRESH",
  lastUpdated = "18s ago",
  significanceScore,
  onViewDetails,
  className,
}: ChangeInsightProps) {
  const isPositive = priceChangePercent >= 0;
  const isMajor = tier === "MAJOR";
  const isSignificant = tier === "SIGNIFICANT";

  return (
    <Card
      className={cn(
        "p-4 sm:p-5 transition-all bg-surface border-border",
        isMajor && "border-brand-accent/40 bg-background-elevated shadow-[0_0_15px_rgba(196,108,119,0.04)]",
        isSignificant && "border-border hover:border-brand-primary/40",
        className
      )}
    >
      {/* Top Bar: Significance Tier & Time Context */}
      <div className="flex items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-border-subtle text-xs">
        <div className="flex items-center gap-2">
          <SignificanceIndicator tier={tier} score={significanceScore} showScore={false} />
          <span className="text-text-muted text-[11px] hidden sm:inline">
            · {checkpointTimeAgo}
          </span>
        </div>
        <FreshnessStatus status={freshnessStatus} lastUpdated={lastUpdated} showIcon={false} />
      </div>

      {/* Main Header: Symbol, Name, Price & Checkpoint Delta */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-base sm:text-lg font-bold tracking-tight text-text-primary uppercase font-mono">
              {symbol}
            </h4>
            <span className="text-xs text-text-muted truncate hidden sm:inline">
              {name}
            </span>
          </div>
          <span className="text-xs text-text-muted truncate sm:hidden block mt-0.5">
            {name}
          </span>
        </div>

        <div className="text-right shrink-0">
          <div className="text-base sm:text-lg font-semibold font-mono tabular-nums text-text-primary">
            {currency}{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold font-mono tabular-nums mt-0.5",
              isPositive ? "text-positive" : "text-negative"
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {priceChangePercent.toFixed(2)}%
            </span>
            {priceChangeAbsolute !== undefined && (
              <span className="text-[11px] opacity-75 font-normal ml-1">
                ({isPositive ? "+" : ""}{priceChangeAbsolute.toFixed(2)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Signal Pill Indicators */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-mono">
        {relativePerformancePercent !== undefined && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-surface-active/60 border border-border text-text-secondary text-[11px]">
            <span className="text-text-muted">vs {benchmarkName}:</span>
            <span
              className={cn(
                "font-medium",
                relativePerformancePercent >= 0 ? "text-positive" : "text-negative"
              )}
            >
              {relativePerformancePercent >= 0 ? "+" : ""}
              {relativePerformancePercent.toFixed(2)} pts
            </span>
          </div>
        )}
        {volumeRatio !== undefined && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-surface-active/60 border border-border text-text-secondary text-[11px]">
            <span className="text-text-muted">Volume:</span>
            <span className={cn("font-medium", volumeRatio >= 2 ? "text-brand-secondary" : "text-text-primary")}>
              {volumeRatio.toFixed(1)}× baseline
            </span>
          </div>
        )}
      </div>

      {/* Structured Observable Evidence / Reasons */}
      {reasons && reasons.length > 0 && (
        <div className="bg-background/70 rounded-[4px] border border-border-subtle p-3 mb-4 space-y-1.5">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Why TRACE flagged this movement
          </div>
          {reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-text-secondary leading-snug">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-secondary mt-0.5" aria-hidden="true" />
              <span>{reason.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <span className="text-[11px] text-text-muted">
          Delta computed against verified checkpoint
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-brand-secondary hover:text-brand-accent hover:bg-brand-surface p-1 px-2.5 h-7 text-xs font-medium"
          onClick={() => onViewDetails?.(symbol)}
        >
          <span>View Details</span>
          <ChevronRight className="h-3.5 w-3.5 ml-0.5" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
}
