import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface QuietStateProps {
  checkpointTime?: string; // e.g. "10:15 AM IST"
  instrumentsCount?: number;
  benchmarkName?: string;
  onViewWatchlist?: () => void;
  className?: string;
}

export function QuietState({
  checkpointTime = "your last check",
  instrumentsCount = 12,
  benchmarkName = "NIFTY 50",
  onViewWatchlist,
  className,
}: QuietStateProps) {
  return (
    <Card
      className={cn(
        "p-6 sm:p-8 bg-surface/80 border-border-subtle text-center flex flex-col items-center justify-center max-w-lg mx-auto my-4",
        className
      )}
    >
      <div className="h-10 w-10 rounded-full bg-brand-surface border border-brand-primary/30 flex items-center justify-center mb-4 text-brand-secondary">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-1 tracking-tight">
        Nothing Significant Changed
      </h3>

      <p className="text-xs text-text-secondary leading-relaxed max-w-sm mb-4">
        Since {checkpointTime}, all {instrumentsCount} instruments in your watchlist have remained within their typical behavioral volatility bands relative to {benchmarkName}.
      </p>

      <div className="flex items-center gap-3 text-xs">
        <span className="text-[11px] text-text-muted">
          Memory baseline active
        </span>
        {onViewWatchlist && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewWatchlist}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            <span>View Full Watchlist</span>
            <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
          </Button>
        )}
      </div>
    </Card>
  );
}
