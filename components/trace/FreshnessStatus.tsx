import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle, Radio, PauseCircle } from "lucide-react";

export type FreshnessType = "FRESH" | "DELAYED" | "STALE" | "UNAVAILABLE";

export interface FreshnessStatusProps {
  status: FreshnessType;
  lastUpdated?: string; // e.g. "18s ago" or ISO timestamp
  delayMinutes?: number;
  className?: string;
  showIcon?: boolean;
}

export function FreshnessStatus({
  status,
  lastUpdated,
  delayMinutes = 15,
  className,
  showIcon = true,
}: FreshnessStatusProps) {
  const config = {
    FRESH: {
      label: "Fresh",
      dotClass: "bg-positive",
      textClass: "text-text-secondary",
      icon: Radio,
      detail: lastUpdated ? `· ${lastUpdated}` : "· Live",
    },
    DELAYED: {
      label: "Delayed",
      dotClass: "bg-text-muted",
      textClass: "text-text-muted",
      icon: Clock,
      detail: `· ${delayMinutes}m delay`,
    },
    STALE: {
      label: "Data Stale",
      dotClass: "bg-stale",
      textClass: "text-stale",
      icon: AlertCircle,
      detail: lastUpdated ? `· Updated ${lastUpdated}` : "· Stale",
    },
    UNAVAILABLE: {
      label: "Unavailable",
      dotClass: "bg-error",
      textClass: "text-error",
      icon: PauseCircle,
      detail: "· Service degraded",
    },
  }[status];

  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium tracking-tight select-none",
        config.textClass,
        className
      )}
      role="status"
      aria-label={`Market data status: ${config.label} ${config.detail}`}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotClass)}
        aria-hidden="true"
      />
      {showIcon && <IconComponent className="h-3 w-3 shrink-0 opacity-80" aria-hidden="true" />}
      <span>
        <span className="font-semibold">{config.label}</span> {config.detail}
      </span>
    </div>
  );
}
