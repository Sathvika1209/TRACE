import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-accent disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer rounded-[4px]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary text-text-primary hover:bg-brand-accent shadow-none active:scale-[0.99]",
        secondary:
          "bg-surface text-text-primary hover:bg-surface-hover border border-border",
        outline:
          "bg-transparent text-text-primary border border-border hover:bg-surface hover:border-text-muted/40",
        ghost:
          "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface",
        subtle:
          "bg-surface/50 text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent",
        danger:
          "bg-negative-surface text-negative border border-negative-border hover:bg-negative/20",
        link:
          "text-brand-secondary underline-offset-4 hover:underline hover:text-brand-accent p-0 h-auto",
      },
      size: {
        default: "h-8 px-3 py-1.5",
        sm: "h-7 px-2.5 text-[11px]",
        lg: "h-9 px-4 text-sm",
        icon: "h-8 w-8",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
