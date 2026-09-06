"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, List, History, Sliders, Palette, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const mobileNavItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Watchlist", href: "/watchlist", icon: List },
  { label: "History", href: "/history", icon: History },
  { label: "Design", href: "/design-system", icon: Palette },
  { label: "Settings", href: "/settings", icon: Sliders },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      {/* Mobile Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background-elevated sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-[3px] bg-brand-primary/20 border border-brand-primary flex items-center justify-center text-brand-secondary font-mono text-[10px] font-bold">
            T
          </div>
          <span className="font-mono font-bold tracking-wider text-xs text-text-primary">
            TRACE
          </span>
        </Link>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="text-text-secondary hover:text-text-primary"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </header>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xs flex flex-col p-6 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-[4px] bg-brand-primary/20 border border-brand-primary flex items-center justify-center text-brand-secondary font-mono text-xs font-bold">
                T
              </div>
              <span className="font-mono font-bold text-sm text-text-primary">
                TRACE
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="space-y-2 flex-1">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-surface text-brand-secondary border border-brand-primary/30"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-brand-accent" : "text-text-muted")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-border text-[11px] text-text-muted space-y-1 font-mono">
            <div>Baseline: 10:15 AM IST</div>
            <div>Indian Equities · NIFTY 50</div>
          </div>
        </div>
      )}

      {/* Compact Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background-elevated border-t border-border flex items-center justify-around py-1.5 px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[10px] font-medium transition-colors",
                isActive
                  ? "text-brand-accent"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
