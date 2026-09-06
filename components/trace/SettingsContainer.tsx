"use client";

import * as React from "react";
import { signOutAction } from "@/app/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  LogOut,
  Cpu,
} from "lucide-react";

interface SettingsContainerProps {
  user: {
    id: string;
    email?: string;
  } | null;
  providerName: string;
}

export function SettingsContainer({
  user,
  providerName,
}: SettingsContainerProps) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOutAction();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
              Configuration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Settings & Account
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            TRACE session parameters, market provider integration, and account details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Information Card */}
        <Card className="p-6 bg-background-elevated border-border space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-secondary">
            <User className="h-4 w-4 text-brand-accent" />
            <span>Authenticated Session</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-text-muted block">
                Email Address
              </span>
              <span className="font-mono font-medium text-text-primary">
                {user?.email || "developer@trace.internal"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-text-muted block">
                User ID
              </span>
              <span className="font-mono text-[11px] text-text-muted select-all">
                {user?.id || "00000000-0000-0000-0000-000000000000"}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Badge variant="brand" size="sm">
                RLS ENFORCED
              </Badge>
              <Badge variant="outline" size="sm">
                SUPABASE AUTH
              </Badge>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-xs text-negative hover:bg-negative/10 hover:border-negative/40 font-medium h-8"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              <span>{isSigningOut ? "Signing Out..." : "Sign Out of TRACE"}</span>
            </Button>
          </div>
        </Card>

        {/* Engine & Provider Configuration */}
        <Card className="p-6 bg-background-elevated border-border space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-secondary">
            <Cpu className="h-4 w-4 text-brand-accent" />
            <span>Market Intelligence Core</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-text-secondary">Market Data Feed</span>
              <span className="font-mono font-medium text-text-primary">
                {providerName === "TRACE_MOCK_PROVIDER" ? "Mock Engine (Dev)" : "Yahoo Finance / NSE"}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-text-secondary">Primary Benchmark</span>
              <span className="font-mono font-medium text-text-primary">
                NIFTY 50 (^NSEI)
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-text-secondary">Change Engine</span>
              <span className="font-mono font-medium text-positive">
                100% Deterministic (Local)
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-text-secondary">Staleness Threshold</span>
              <span className="font-mono font-medium text-text-primary">
                20m (Delayed) / 24h (Stale)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-[4px] bg-surface border border-border-subtle text-[11px] text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">Strict Zero-LLM Principle:</span>{" "}
            All market change evaluations, significance scoring, and ranking execute via local mathematical heuristics without cloud AI latency or hallucination risks.
          </div>
        </Card>
      </div>
    </div>
  );
}
