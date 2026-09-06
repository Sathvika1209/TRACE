"use client";

import * as React from "react";
import Link from "next/link";
import { InstrumentDetailData } from "@/app/actions/trace";
import { SignificanceIndicator } from "./SignificanceIndicator";
import { FreshnessStatus } from "./FreshnessStatus";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  BarChart3,
  Scale,
} from "lucide-react";

interface InstrumentDetailContainerProps {
  data: InstrumentDetailData;
}

export function InstrumentDetailContainer({
  data,
}: InstrumentDetailContainerProps) {
  const isPositive = (data.evidence.priceDeltaPercent ?? 0) >= 0;
  const currentPrice = data.currentQuote.price ?? 0;
  const deltaPct = data.evidence.priceDeltaPercent ?? 0;
  const deltaAbs = data.evidence.priceDelta ?? 0;

  // Format Checkpoint Timestamp
  const formattedCheckpointTime = data.checkpointTimestamp
    ? new Date(data.checkpointTimestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  // Prepare SVG chart points from historical bars
  const bars = data.historicalBars || [];
  const prices = bars.map((b) => b.close);
  const minPrice = prices.length > 0 ? Math.min(...prices) * 0.99 : 100;
  const maxPrice = prices.length > 0 ? Math.max(...prices) * 1.01 : 200;
  const priceRange = maxPrice - minPrice || 1;

  const chartWidth = 500;
  const chartHeight = 140;

  const points = bars.map((bar, idx) => {
    const x = (idx / (bars.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((bar.close - minPrice) / priceRange) * chartHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylineStr = points.join(" ");

  // Baseline price line coordinate
  const baselinePrice = data.evidence.baselinePrice;
  const baselineY =
    baselinePrice && baselinePrice >= minPrice && baselinePrice <= maxPrice
      ? chartHeight - ((baselinePrice - minPrice) / priceRange) * chartHeight
      : null;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/watchlist"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Watchlist</span>
        </Link>
      </div>

      {/* Main Instrument Header Card */}
      <Card className="p-6 sm:p-8 bg-background-elevated border-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <SignificanceIndicator
                tier={data.evidence.significanceTier}
                score={data.evidence.significanceScore}
                showScore={true}
              />
              <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                {data.exchange}
              </Badge>
              <FreshnessStatus
                status={data.currentQuote.dataStatus}
                lastUpdated="Live"
                showIcon={true}
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-mono uppercase">
              {data.symbol}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              {data.displayName || data.symbol} &middot; Indian Equity
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-text-primary">
              ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div
              className={`inline-flex items-center gap-1 text-sm font-semibold font-mono tabular-nums mt-0.5 ${
                isPositive ? "text-positive" : "text-negative"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              ) : (
                <ArrowDownRight className="h-4 w-4 shrink-0" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {deltaPct.toFixed(2)}%
              </span>
              <span className="text-xs opacity-75 font-normal ml-1">
                ({isPositive ? "+" : ""}₹{deltaAbs.toFixed(2)} since checkpoint)
              </span>
            </div>
          </div>
        </div>

        {/* Narrative Summary */}
        <div className="p-3.5 rounded-[4px] bg-surface/70 border border-border text-xs text-text-secondary leading-relaxed">
          <span className="font-semibold text-text-primary font-mono mr-1">
            TRACE Analysis:
          </span>
          {data.explanation}
        </div>

        {/* Lightweight SVG Price Trajectory Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-text-muted">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-brand-accent" />
              <span>20-Day Price Trajectory & Checkpoint Reference</span>
            </span>
            <span>Range: ₹{minPrice.toFixed(1)} – ₹{maxPrice.toFixed(1)}</span>
          </div>

          <div className="h-36 w-full bg-surface rounded-[4px] border border-border-subtle p-3 flex items-center justify-center relative overflow-hidden">
            {bars.length > 2 ? (
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Horizontal grid lines */}
                <line
                  x1="0"
                  y1={chartHeight / 2}
                  x2={chartWidth}
                  y2={chartHeight / 2}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />

                {/* Baseline reference line if present */}
                {baselineY !== null && (
                  <>
                    <line
                      x1="0"
                      y1={baselineY}
                      x2={chartWidth}
                      y2={baselineY}
                      stroke="rgba(196,108,119,0.5)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x="8"
                      y={baselineY - 4}
                      fill="rgba(196,108,119,0.8)"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      Baseline: ₹{baselinePrice?.toFixed(2)}
                    </text>
                  </>
                )}

                {/* Price Trajectory Line */}
                <polyline
                  fill="none"
                  stroke={isPositive ? "#4ade80" : "#f87171"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylineStr}
                />
              </svg>
            ) : (
              <span className="text-xs text-text-muted">
                Insufficient historical bars for charting.
              </span>
            )}
          </div>
        </div>

        {/* 4-Card Analytical Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Baseline Checkpoint */}
          <div className="p-3.5 rounded-[4px] bg-surface border border-border space-y-1">
            <div className="flex items-center gap-1 text-[10px] uppercase font-mono text-text-muted">
              <Clock className="h-3 w-3" />
              <span>Checkpoint Baseline</span>
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-text-primary">
              {data.evidence.baselinePrice
                ? `₹${data.evidence.baselinePrice.toFixed(2)}`
                : "None Recorded"}
            </div>
            <div className="text-[10px] text-text-muted truncate">
              {formattedCheckpointTime ? `Recorded at ${formattedCheckpointTime}` : "Initial visit"}
            </div>
          </div>

          {/* Card 2: Benchmark Divergence */}
          <div className="p-3.5 rounded-[4px] bg-surface border border-border space-y-1">
            <div className="flex items-center gap-1 text-[10px] uppercase font-mono text-text-muted">
              <Scale className="h-3 w-3" />
              <span>vs NIFTY 50</span>
            </div>
            <div
              className={`text-sm font-bold font-mono tabular-nums ${
                (data.evidence.relativePerformance ?? 0) >= 0
                  ? "text-positive"
                  : "text-negative"
              }`}
            >
              {data.evidence.relativePerformance !== null
                ? `${data.evidence.relativePerformance >= 0 ? "+" : ""}${data.evidence.relativePerformance.toFixed(2)} pts`
                : "N/A"}
            </div>
            <div className="text-[10px] text-text-muted truncate">
              NIFTY: {typeof data.benchmarkQuote?.changePercent === "number" ? `${data.benchmarkQuote.changePercent >= 0 ? "+" : ""}${data.benchmarkQuote.changePercent.toFixed(2)}%` : "0.00%"}
            </div>
          </div>

          {/* Card 3: Volume Ratio */}
          <div className="p-3.5 rounded-[4px] bg-surface border border-border space-y-1">
            <div className="flex items-center gap-1 text-[10px] uppercase font-mono text-text-muted">
              <BarChart3 className="h-3 w-3" />
              <span>Volume Anomaly</span>
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-text-primary">
              {data.evidence.volumeRatio !== null
                ? `${data.evidence.volumeRatio.toFixed(1)}× baseline`
                : "Standard Volume"}
            </div>
            <div className="text-[10px] text-text-muted truncate">
              Avg: {(data.baselineMetrics?.avgVolume20d || 1000000).toLocaleString("en-IN")} shs
            </div>
          </div>

          {/* Card 4: Volatility Ratio */}
          <div className="p-3.5 rounded-[4px] bg-surface border border-border space-y-1">
            <div className="flex items-center gap-1 text-[10px] uppercase font-mono text-text-muted">
              <Layers className="h-3 w-3" />
              <span>Intraday Volatility</span>
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-text-primary">
              {data.evidence.volatilityRatio !== null
                ? `${data.evidence.volatilityRatio.toFixed(1)}× normal range`
                : "Normal Spread"}
            </div>
            <div className="text-[10px] text-text-muted truncate">
              High: ₹{data.currentQuote.dayHigh?.toFixed(2) || "—"} / Low: ₹{data.currentQuote.dayLow?.toFixed(2) || "—"}
            </div>
          </div>
        </div>

        {/* Structured Factual Reasons List */}
        {data.evidence.reasons.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text-secondary">
              Observed Market Evidence ({data.evidence.reasons.length})
            </h3>
            <div className="space-y-2">
              {data.evidence.reasons.map((r, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-[4px] bg-surface border border-border-subtle flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-secondary shrink-0 mt-0.5" />
                    <span className="text-text-primary">{r.description}</span>
                  </div>
                  {r.factualMetric && (
                    <Badge variant="outline" size="sm" className="font-mono text-[10px] shrink-0">
                      {r.factualMetric}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
