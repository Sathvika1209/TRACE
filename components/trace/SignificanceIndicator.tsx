import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type SignificanceTier = "NORMAL" | "NOTABLE" | "SIGNIFICANT" | "MAJOR";

export interface SignificanceIndicatorProps {
  tier: SignificanceTier;
  score?: number; // Optional 0–100 score
  showScore?: boolean;
  className?: string;
  size?: "sm" | "default" | "md";
}

export function SignificanceIndicator({
  tier,
  score,
  showScore = false,
  className,
  size = "default",
}: SignificanceIndicatorProps) {
  const tierConfig = {
    NORMAL: {
      label: "NORMAL",
      variant: "sig-normal" as const,
      description: "Within historical variance",
    },
    NOTABLE: {
      label: "NOTABLE",
      variant: "sig-notable" as const,
      description: "Moderate divergence",
    },
    SIGNIFICANT: {
      label: "SIGNIFICANT",
      variant: "sig-significant" as const,
      description: "Meaningful multi-signal divergence",
    },
    MAJOR: {
      label: "MAJOR",
      variant: "sig-major" as const,
      description: "High-magnitude structural divergence",
    },
  }[tier];

  return (
    <Badge
      variant={tierConfig.variant}
      size={size}
      className={cn("tracking-wider uppercase font-mono", className)}
      title={tierConfig.description}
    >
      <span>{tierConfig.label}</span>
      {showScore && typeof score === "number" && (
        <span className="opacity-70 text-[10px] ml-0.5 tabular-nums">
          [{score}]
        </span>
      )}
    </Badge>
  );
}
