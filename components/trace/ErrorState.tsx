import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, WifiOff, Clock } from "lucide-react";

export type ErrorType = "PROVIDER_UNAVAILABLE" | "DATA_STALE" | "INSTRUMENT_FAILED" | "GENERIC";

export interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  description?: string;
  lastKnownSnapshotTime?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorState({
  type = "PROVIDER_UNAVAILABLE",
  title,
  description,
  lastKnownSnapshotTime,
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  const config = {
    PROVIDER_UNAVAILABLE: {
      icon: WifiOff,
      title: title || "Market Data Feed Interrupted",
      description:
        description ||
        `Real-time quote updates are temporarily unavailable. Displaying the last verified checkpoint baseline${
          lastKnownSnapshotTime ? ` from ${lastKnownSnapshotTime}` : ""
        }.`,
      borderClass: "border-warning/40",
      iconClass: "text-warning",
    },
    DATA_STALE: {
      icon: Clock,
      title: title || "Market Quotes Delayed / Stale",
      description:
        description ||
        "The exchange data feed has exceeded normal latency thresholds. Figures may not reflect immediate ticks.",
      borderClass: "border-stale/40",
      iconClass: "text-stale",
    },
    INSTRUMENT_FAILED: {
      icon: AlertCircle,
      title: title || "Instrument Unavailable",
      description:
        description ||
        "Quotes for this specific symbol could not be retrieved from the exchange feed.",
      borderClass: "border-border",
      iconClass: "text-text-muted",
    },
    GENERIC: {
      icon: AlertCircle,
      title: title || "Operation Failed",
      description: description || "An unexpected error occurred while processing your request.",
      borderClass: "border-error/40",
      iconClass: "text-error",
    },
  }[type];

  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "p-4 sm:p-5 bg-surface/90 border text-left flex flex-col sm:flex-row items-start gap-3.5",
        config.borderClass,
        className
      )}
      role="alert"
    >
      <div className={cn("p-1.5 rounded-[4px] bg-background-elevated shrink-0 mt-0.5", config.iconClass)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-text-primary mb-1">
          {config.title}
        </h4>
        <p className="text-xs text-text-secondary leading-relaxed mb-3">
          {config.description}
        </p>

        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="text-[11px] h-7 px-2.5"
          >
            <RefreshCw className={cn("h-3 w-3 mr-1.5", isRetrying && "animate-spin")} />
            <span>{isRetrying ? "Reconnecting..." : "Retry Connection"}</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
