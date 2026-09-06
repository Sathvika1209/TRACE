import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Activity, BarChart2, Clock } from "lucide-react";

export type EvidenceType =
  | "PRICE_DELTA"
  | "BENCHMARK_RELATIVE"
  | "VOLUME_RATIO"
  | "VOLATILITY_EXPANSION"
  | "ELAPSED_TIME"
  | "CUSTOM";

export interface EvidenceRowProps {
  type?: EvidenceType;
  label: string;
  value: string | React.ReactNode;
  subtext?: string;
  divergence?: "positive" | "negative" | "neutral";
  className?: string;
}

export function EvidenceRow({
  type = "CUSTOM",
  label,
  value,
  subtext,
  divergence = "neutral",
  className,
}: EvidenceRowProps) {
  const Icon = {
    PRICE_DELTA: divergence === "negative" ? TrendingDown : TrendingUp,
    BENCHMARK_RELATIVE: Activity,
    VOLUME_RATIO: BarChart2,
    VOLATILITY_EXPANSION: Activity,
    ELAPSED_TIME: Clock,
    CUSTOM: Activity,
  }[type];

  const colorClass = {
    positive: "text-positive",
    negative: "text-negative",
    neutral: "text-text-primary",
  }[divergence];

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 border-b border-border-subtle last:border-0 text-xs",
        className
      )}
    >
      <div className="flex items-center gap-2 text-text-secondary min-w-0 pr-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-text-muted opacity-80" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-right shrink-0">
        <span className={cn("font-medium font-mono tabular-nums", colorClass)}>
          {value}
        </span>
        {subtext && (
          <span className="block text-[10px] text-text-muted font-normal mt-0.5">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
