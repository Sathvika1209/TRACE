"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  OverviewData,
  createCheckpointAction,
  refreshOverviewAction,
} from "@/app/actions/trace";
import { ChangeInsight } from "./ChangeInsight";
import { InstrumentRow } from "./InstrumentRow";
import { QuietState } from "./QuietState";
import { FreshnessStatus } from "./FreshnessStatus";
import { ErrorState } from "./ErrorState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  RefreshCw,
  Camera,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  ShieldCheck,
  Compass,
} from "lucide-react";
import Link from "next/link";

interface OverviewContainerProps {
  initialData: OverviewData;
}

export function OverviewContainer({ initialData }: OverviewContainerProps) {
  const router = useRouter();
  const [data, setData] = React.useState<OverviewData>(initialData);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isCheckpointing, setIsCheckpointing] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Clear feedback after 4 seconds
  React.useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const handleRefresh = async () => {
    if (isRefreshing || isCheckpointing) return;
    setIsRefreshing(true);
    setFeedbackMessage(null);

    try {
      if (data.watchlist?.id) {
        const freshData = await refreshOverviewAction(data.watchlist.id);
        if (freshData.error) {
          setFeedbackMessage({ type: "error", text: freshData.error });
        } else {
          setData(freshData);
          setFeedbackMessage({
            type: "success",
            text: "Market quotes refreshed against existing checkpoint.",
          });
        }
      }
    } catch {
      setFeedbackMessage({
        type: "error",
        text: "Failed to refresh market data. Please try again.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCheckpoint = async () => {
    if (isCheckpointing || isRefreshing) return;
    if (!data.watchlist?.id) return;

    setIsCheckpointing(true);
    setFeedbackMessage(null);

    try {
      const result = await createCheckpointAction(data.watchlist.id);
      if (!result.success) {
        setFeedbackMessage({
          type: "error",
          text: result.error || "Failed to create checkpoint.",
        });
      } else {
        setFeedbackMessage({
          type: "success",
          text: "New checkpoint baseline established. Watchlist memory saved.",
        });
        // Reload fresh data to update UI with the new baseline
        const freshData = await refreshOverviewAction(data.watchlist.id);
        setData(freshData);
      }
    } catch {
      setFeedbackMessage({
        type: "error",
        text: "An error occurred while creating checkpoint.",
      });
    } finally {
      setIsCheckpointing(false);
    }
  };

  const handleViewDetails = (symbol: string) => {
    router.push(`/watchlist/${encodeURIComponent(symbol.toUpperCase())}`);
  };

  // Format checkpoint timestamp
  const checkpointTimestamp = data.latestCheckpoint?.createdAt;
  const formattedCheckpointTime = checkpointTimestamp
    ? new Date(checkpointTimestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const formattedCheckpointDate = checkpointTimestamp
    ? new Date(checkpointTimestamp).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })
    : null;

  const meaningfulChanges = data.changeResult?.changes.filter(
    (item) => item.evidence.significanceTier !== "NORMAL"
  ) || [];

  const itemsCount = data.watchlist?.items?.length ?? 0;
  const isQuietState =
    data.latestCheckpoint !== null &&
    (data.changeResult?.isQuietState ?? true) &&
    itemsCount > 0;

  const hasNoBaseline = data.latestCheckpoint === null && itemsCount > 0;
  const isWatchlistEmpty = itemsCount === 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner / Feedback Alert */}
      {feedbackMessage && (
        <div
          role="status"
          className={`p-3 rounded-[4px] border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
            feedbackMessage.type === "success"
              ? "bg-positive/10 border-positive/30 text-positive"
              : "bg-negative/10 border-negative/30 text-negative"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <ErrorState type="GENERIC" className="p-0 border-0 bg-transparent" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
              Market Memory
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-[11px] text-text-muted font-mono">
              {data.watchlist?.name || "Main Watchlist"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Since your last check
          </h1>
          <p className="text-xs text-text-secondary mt-1 flex items-center gap-1.5 font-mono">
            <Clock className="h-3.5 w-3.5 text-text-muted" />
            {checkpointTimestamp ? (
              <span>
                Baseline established: <strong>{formattedCheckpointTime}</strong> ({formattedCheckpointDate})
              </span>
            ) : (
              <span className="text-warning">No previous checkpoint recorded</span>
            )}
          </p>
        </div>

        {/* Action Controls: Refresh vs Checkpoint */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isCheckpointing}
            className="text-xs h-8 px-3 font-medium bg-surface hover:bg-surface-active"
            title="Fetch latest market quotes without altering your checkpoint baseline"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-brand-accent" : "text-text-muted"}`}
            />
            <span>{isRefreshing ? "Checking..." : "Refresh"}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleCheckpoint}
            disabled={isCheckpointing || isRefreshing || isWatchlistEmpty}
            className="text-xs h-8 px-3 font-semibold shadow-xs"
            title="Set a new baseline snapshot from current market quotes"
          >
            <Camera
              className={`h-3.5 w-3.5 mr-1.5 ${isCheckpointing ? "animate-pulse" : ""}`}
            />
            <span>{isCheckpointing ? "Saving..." : "Checkpoint"}</span>
          </Button>
        </div>
      </div>

      {/* STATE 1: Empty Watchlist */}
      {isWatchlistEmpty && (
        <Card className="p-8 bg-surface border-border text-center space-y-4">
          <div className="h-10 w-10 rounded-full bg-surface-active border border-border flex items-center justify-center mx-auto text-text-muted">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Your Watchlist is Empty</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
              Add your key Indian equities to start tracking meaningful changes and establishing memory baselines.
            </p>
          </div>
          <Link href="/watchlist">
            <Button size="sm" className="text-xs font-semibold">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Add Instruments to Watchlist</span>
            </Button>
          </Link>
        </Card>
      )}

      {/* STATE 2: No Baseline State (First Visit / Onboarding) */}
      {hasNoBaseline && !isWatchlistEmpty && (
        <Card className="p-6 sm:p-8 bg-background-elevated border-brand-primary/40 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-mono text-brand-secondary font-semibold uppercase">
            <ShieldCheck className="h-4 w-4 text-brand-accent" />
            <span>TRACE Needs a Starting Point</span>
          </div>

          <h3 className="text-lg font-bold text-text-primary tracking-tight">
            Establish Your First Market Baseline
          </h3>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl">
            TRACE tracks what changes while you are away. To begin, capture an initial baseline snapshot of your watchlist instruments. Every time you return, TRACE will compare live quotes against this checkpoint.
          </p>

          <div className="pt-2">
            <Button
              variant="default"
              onClick={handleCheckpoint}
              disabled={isCheckpointing}
              className="text-xs font-semibold"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              <span>{isCheckpointing ? "Establishing..." : "Create First Checkpoint"}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* STATE 3: Meaningful Change Feed */}
      {!hasNoBaseline && !isWatchlistEmpty && meaningfulChanges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-accent" />
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary">
                Flagged Meaningful Changes ({meaningfulChanges.length})
              </h2>
            </div>
            <span className="text-[11px] text-text-muted font-mono">
              Ranked by Multi-Signal Divergence
            </span>
          </div>

          <div className="space-y-3">
            {meaningfulChanges.map((change) => {
              const currentQuote = data.currentQuotes[change.symbol];
              const price = currentQuote?.price ?? change.evidence.currentPrice ?? 0;
              const deltaPct = change.evidence.priceDeltaPercent ?? 0;
              const deltaAbs = change.evidence.priceDelta ?? undefined;

              return (
                <ChangeInsight
                  key={change.symbol}
                  tier={change.evidence.significanceTier}
                  symbol={change.symbol}
                  name={change.instrumentName || change.symbol}
                  currentPrice={price}
                  priceChangePercent={deltaPct}
                  priceChangeAbsolute={deltaAbs}
                  benchmarkName="NIFTY 50"
                  relativePerformancePercent={
                    change.evidence.relativePerformance ?? undefined
                  }
                  volumeRatio={change.evidence.volumeRatio ?? undefined}
                  reasons={change.evidence.reasons.map((r) => ({
                    code: String(r.code),
                    description: r.description,
                  }))}
                  checkpointTimeAgo={`Since ${formattedCheckpointTime || "checkpoint"}`}
                  freshnessStatus={currentQuote?.dataStatus || change.evidence.dataStatus}
                  lastUpdated="Just now"
                  significanceScore={change.evidence.significanceScore}
                  onViewDetails={handleViewDetails}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* STATE 4: Quiet State (When all changes are NORMAL) */}
      {isQuietState && (
        <QuietState
          checkpointTime={formattedCheckpointTime || "your last check"}
          instrumentsCount={itemsCount}
          benchmarkName="NIFTY 50"
          onViewWatchlist={() => router.push("/watchlist")}
        />
      )}

      {/* Compact Watchlist Section */}
      {!isWatchlistEmpty && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text-secondary">
              Watchlist Overview ({itemsCount})
            </h3>
            <Link
              href="/watchlist"
              className="text-[11px] text-brand-secondary hover:text-brand-accent transition-colors font-medium"
            >
              Manage Watchlist &rarr;
            </Link>
          </div>

          <div className="divide-y divide-border-subtle rounded-[4px] border border-border bg-surface/50 overflow-hidden">
            {(data.watchlist?.items || []).map((item) => {
              const quote = data.currentQuotes[item.symbol];
              const changeItem = data.changeResult?.changes.find(
                (c) => c.symbol === item.symbol
              );
              const deltaPct = changeItem?.evidence.priceDeltaPercent ?? quote?.changePercent ?? 0;

              return (
                <div
                  key={item.id}
                  onClick={() => handleViewDetails(item.symbol)}
                  className="cursor-pointer hover:bg-surface-active/50 transition-colors"
                >
                  <InstrumentRow
                    symbol={item.symbol}
                    name={item.displayName || item.symbol}
                    currentPrice={quote?.price ?? 0}
                    priceChangePercent={deltaPct}
                    tier={changeItem?.evidence.significanceTier || "NORMAL"}
                    isStale={quote?.dataStatus === "STALE"}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Trust & Freshness Status Footer */}
      <div className="p-3.5 rounded-[4px] bg-surface/40 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-text-muted">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold uppercase text-text-secondary">
            Data Trust:
          </span>
          <FreshnessStatus status="FRESH" lastUpdated="Live" showIcon={true} />
          <span>· Provider: {data.providerName}</span>
        </div>
        <div className="font-mono text-[10px]">
          Benchmark: NIFTY 50 ({data.benchmarkQuote?.price ? `₹${data.benchmarkQuote.price.toLocaleString("en-IN")}` : "Tracking"})
        </div>
      </div>
    </div>
  );
}
