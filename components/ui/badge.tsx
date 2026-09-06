import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium transition-colors select-none rounded-[4px] border",
  {
    variants: {
      variant: {
        default:
          "bg-surface text-text-primary border-border",
        subtle:
          "bg-border-subtle text-text-secondary border-transparent",
        outline:
          "bg-transparent text-text-secondary border-border",
        brand:
          "bg-brand-surface text-brand-secondary border-brand-primary/40",
        positive:
          "bg-positive-surface text-positive border-positive-border",
        negative:
          "bg-negative-surface text-negative border-negative-border",
        warning:
          "bg-warning-surface text-warning border-warning-border",
        stale:
          "bg-stale-surface text-stale border-stale-border",
        info:
          "bg-info-surface text-info border-info-border",
        // Significance Tiers
        "sig-normal":
          "bg-surface text-text-muted border-border",
        "sig-notable":
          "bg-surface text-text-secondary border-border",
        "sig-significant":
          "bg-brand-surface text-brand-secondary border-brand-accent/40 font-semibold",
        "sig-major":
          "bg-brand-accent/20 text-brand-accent border-brand-accent/60 font-semibold tracking-wide",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.2",
        default: "text-xs px-2 py-0.5",
        md: "text-xs px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
