"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, List, History, Sliders, Palette, Shield } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Watchlist", href: "/watchlist", icon: List },
  { label: "History", href: "/history", icon: History },
  { label: "Design System", href: "/design-system", icon: Palette, badge: "DEV" },
  { label: "Settings", href: "/settings", icon: Sliders },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-56 lg:w-64 border-r border-border bg-background-elevated h-screen sticky top-0 shrink-0 select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-4 lg:p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-6 w-6 rounded-[4px] bg-brand-primary/20 border border-brand-primary flex items-center justify-center text-brand-secondary font-mono text-xs font-black">
            T
          </div>
          <div>
            <span className="font-mono font-bold tracking-wider text-sm text-text-primary group-hover:text-brand-accent transition-colors block leading-none">
              TRACE
            </span>
            <span className="text-[10px] text-text-muted tracking-tight block mt-0.5">
              Know what changed
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-2 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-2.5 py-2 rounded-[4px] text-xs font-medium transition-colors",
                isActive
                  ? "bg-brand-surface text-brand-secondary border border-brand-primary/30"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-brand-accent" : "text-text-muted")} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-surface border border-border text-text-muted">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Memory Layer Baseline Status Footer */}
      <div className="p-3 border-t border-border bg-surface/50 text-[11px] space-y-1.5">
        <div className="flex items-center justify-between text-text-muted">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="h-3 w-3 text-brand-secondary" />
            <span>Memory Baseline</span>
          </span>
          <span className="text-[10px] text-positive font-mono">Active</span>
        </div>
        <div className="text-[10px] text-text-muted truncate font-mono">
          Last Check: 10:15 AM IST
        </div>
      </div>
    </aside>
  );
}
