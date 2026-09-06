"use client";

import * as React from "react";
import { UserCheckpoint } from "@/types/checkpoint";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Camera,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface HistoryContainerProps {
  checkpoints: UserCheckpoint[];
  error?: string;
}

export function HistoryContainer({
  checkpoints,
  error,
}: HistoryContainerProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
              Market Memory Ledger
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-[11px] text-text-muted font-mono">
              {checkpoints.length} Saved Checkpoints
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Checkpoint History
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Chronological log of discrete market baselines recorded during your sessions.
          </p>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-negative/10 border-negative/30 text-xs text-negative">
          {error}
        </Card>
      )}

      {/* Empty State */}
      {checkpoints.length === 0 ? (
        <Card className="p-8 bg-surface border-border text-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-surface-active border border-border flex items-center justify-center mx-auto text-text-muted">
            <Camera className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">
            No Checkpoints Recorded Yet
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            When you checkpoint your watchlist from the Overview screen, each memory baseline will be cataloged here for full historical transparency.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {checkpoints.map((cp, idx) => {
            const dateObj = new Date(cp.createdAt);
            const timeStr = dateObj.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            });
            const dateStr = dateObj.toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const isExpanded = expandedId === cp.id;
            const snapshotCount = cp.snapshots?.length || 0;
            const isLatest = idx === 0;

            return (
              <Card
                key={cp.id}
                className={`p-4 sm:p-5 bg-background-elevated border transition-all ${
                  isLatest ? "border-brand-primary/40 shadow-xs" : "border-border"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-[4px] border flex items-center justify-center shrink-0 ${
                        isLatest
                          ? "bg-brand-surface border-brand-primary/40 text-brand-secondary"
                          : "bg-surface border-border text-text-muted"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-text-primary">
                          {timeStr}
                        </span>
                        <span className="text-xs text-text-muted">· {dateStr}</span>
                        {isLatest && (
                          <Badge variant="brand" size="sm" className="text-[9px]">
                            ACTIVE BASELINE
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-muted font-mono">
                        <span>ID: {cp.id.substring(0, 8)}...</span>
                        <span>·</span>
                        <span>{snapshotCount} instruments captured</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(cp.id)}
                    className="flex items-center gap-1 text-xs text-brand-secondary hover:text-brand-accent transition-colors font-mono font-medium self-end sm:self-center"
                  >
                    <span>{isExpanded ? "Hide Snapshots" : "View Snapshots"}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Expanded Snapshot Grid */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border-subtle space-y-2 animate-in fade-in duration-150">
                    <span className="text-[10px] font-mono uppercase text-text-muted tracking-wider block">
                      Captured Baseline Snapshots:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {cp.snapshots?.map((snap) => (
                        <div
                          key={snap.id}
                          className="p-2.5 rounded-[4px] bg-surface border border-border-subtle text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-bold text-text-primary">
                              {snap.symbol}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {snap.dataStatus}
                            </span>
                          </div>
                          <div className="font-mono text-text-secondary text-[11px]">
                            {snap.price !== null
                              ? `₹${snap.price.toFixed(2)}`
                              : "Unavailable"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
