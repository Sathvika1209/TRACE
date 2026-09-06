"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col md:flex-row antialiased">
      {/* Mobile Top & Bottom Navigation */}
      <MobileNav />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 pb-16 md:pb-6 overflow-x-hidden",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
