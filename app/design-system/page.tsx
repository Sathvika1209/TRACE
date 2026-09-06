"use client";

import * as React from "react";
import { AppShell } from "@/components/trace/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ChangeInsight,
  InstrumentRow,
  SignificanceIndicator,
  FreshnessStatus,
  EvidenceRow,
  QuietState,
  ChangeInsightSkeleton,
  WatchlistTableSkeleton,
  ErrorState,
} from "@/components/trace";
import {
  Shield,
  Search,
  RefreshCw,
} from "lucide-react";

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "typography" | "colors" | "primitives" | "components" | "states"
  >("overview");

  return (
    <AppShell>
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Showcase Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="brand" size="sm">
                INTERNAL DESIGN SYSTEM
              </Badge>
              <span className="text-[11px] text-text-muted font-mono">
                Phase 3 · Deep Rose & Ink
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              TRACE Design Foundation
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Authoritative visual specification, design tokens, and representative component sandbox.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <FreshnessStatus status="FRESH" lastUpdated="Live Sandbox" />
          </div>
        </div>

        {/* Showcase Section Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border text-xs scrollbar-none">
          {[
            { id: "overview", label: "Overview & Showcase" },
            { id: "components", label: "Domain Components" },
            { id: "states", label: "UX & Operational States" },
            { id: "typography", label: "Typography" },
            { id: "colors", label: "Color Tokens" },
            { id: "primitives", label: "UI Primitives" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-[4px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-brand-surface text-brand-secondary border border-brand-primary/40 font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SECTION 1: OVERVIEW & SHOWCASE */}
        {(activeTab === "overview" || activeTab === "components") && (
          <section className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-1">
                Representative Showcase
              </h2>
              <p className="text-xs text-text-secondary">
                Simulated feed demonstrating the core TRACE question: <em className="text-text-primary">&ldquo;What changed while I was away?&rdquo;</em>
              </p>
            </div>

            {/* Simulated Hero Metric */}
            <Card className="p-4 sm:p-5 bg-background-elevated border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                    <Shield className="h-3.5 w-3.5 text-brand-secondary" />
                    <span>Since Your Last Check (10:15 AM IST · 4h 15m ago)</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-text-primary mt-1">
                    3 Meaningful Changes Detected
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    1 Major Divergence · 1 Significant Volume Spike · 1 Notable Relative Loss
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1.5 rounded-[4px] bg-surface border border-border text-center">
                    <div className="text-[10px] text-text-muted font-mono">NIFTY 50</div>
                    <div className="text-xs font-semibold font-mono tabular-nums text-positive">+0.45%</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    <span>Establish Checkpoint</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Flagship ChangeInsight Cards (Major & Significant Examples) */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Ranked Meaningful Change Feed
              </h3>

              <ChangeInsight
                tier="MAJOR"
                symbol="TATAMOTORS"
                name="Tata Motors Passenger Vehicles Ltd."
                currentPrice={1042.5}
                priceChangePercent={4.85}
                priceChangeAbsolute={48.2}
                benchmarkName="NIFTY 50"
                relativePerformancePercent={4.4}
                volumeRatio={3.1}
                significanceScore={86}
                checkpointTimeAgo="Since 10:15 AM (4h ago)"
                freshnessStatus="FRESH"
                lastUpdated="12s ago"
                reasons={[
                  {
                    code: "VOLATILITY_EXPANSION",
                    description: "Price movement is 3.4× its typical intraday volatility range (ATR).",
                  },
                  {
                    code: "VOLUME_SURGE",
                    description: "Trading volume is 3.1× higher than average baseline at this hour.",
                  },
                  {
                    code: "BENCHMARK_OUTPERFORMANCE",
                    description: "Outperformed NIFTY 50 (+0.45%) by +4.40 percentage points.",
                  },
                ]}
                onViewDetails={(sym) => console.log("Inspect:", sym)}
              />

              <ChangeInsight
                tier="SIGNIFICANT"
                symbol="INFY"
                name="Infosys Limited"
                currentPrice={1820.0}
                priceChangePercent={-2.35}
                priceChangeAbsolute={-43.8}
                benchmarkName="NIFTY 50"
                relativePerformancePercent={-2.8}
                volumeRatio={1.9}
                significanceScore={68}
                checkpointTimeAgo="Since 10:15 AM (4h ago)"
                freshnessStatus="FRESH"
                lastUpdated="24s ago"
                reasons={[
                  {
                    code: "BENCHMARK_DIVERGENCE",
                    description: "Sharp divergence: dropped -2.35% while benchmark gained +0.45%.",
                  },
                  {
                    code: "VOLUME_ELEVATION",
                    description: "Selling volume is 1.9× typical baseline.",
                  },
                ]}
                onViewDetails={(sym) => console.log("Inspect:", sym)}
              />

              <ChangeInsight
                tier="NOTABLE"
                symbol="HDFCBANK"
                name="HDFC Bank Limited"
                currentPrice={1645.2}
                priceChangePercent={1.65}
                priceChangeAbsolute={26.7}
                benchmarkName="NIFTY 50"
                relativePerformancePercent={1.2}
                volumeRatio={1.4}
                significanceScore={48}
                checkpointTimeAgo="Since 10:15 AM (4h ago)"
                freshnessStatus="DELAYED"
                lastUpdated="15m delay"
                reasons={[
                  {
                    code: "MOMENTUM_BUILD",
                    description: "Steady gain crossing weekly pivot with moderate volume support.",
                  },
                ]}
                onViewDetails={(sym) => console.log("Inspect:", sym)}
              />
            </div>

            {/* Representative Watchlist Rows */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Watchlist Overview (Secondary Feed)
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Compact list sorted by symbol or delta relative to checkpoint.
                  </p>
                </div>
                <div className="relative w-48 hidden sm:block">
                  <Search className="h-3 w-3 absolute left-2.5 top-2.5 text-text-muted" />
                  <Input placeholder="Filter symbols..." className="pl-7 h-7 text-[11px]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <InstrumentRow
                  symbol="RELIANCE"
                  name="Reliance Industries Ltd."
                  currentPrice={2980.45}
                  priceChangePercent={0.85}
                  tier="NORMAL"
                  volumeRatio={1.1}
                  onClick={(sym) => console.log("Row clicked:", sym)}
                />
                <InstrumentRow
                  symbol="TCS"
                  name="Tata Consultancy Services"
                  currentPrice={4120.0}
                  priceChangePercent={-0.42}
                  tier="NORMAL"
                  volumeRatio={0.9}
                  onClick={(sym) => console.log("Row clicked:", sym)}
                />
                <InstrumentRow
                  symbol="BHARTIARTL"
                  name="Bharti Airtel Limited"
                  currentPrice={1412.3}
                  priceChangePercent={2.15}
                  tier="NOTABLE"
                  volumeRatio={1.8}
                  onClick={(sym) => console.log("Row clicked:", sym)}
                />
                <InstrumentRow
                  symbol="ITC"
                  name="ITC Limited"
                  currentPrice={485.6}
                  priceChangePercent={-0.12}
                  tier="NORMAL"
                  isStale={true}
                  onClick={(sym) => console.log("Row clicked:", sym)}
                />
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: OPERATIONAL & UX STATES */}
        {(activeTab === "overview" || activeTab === "states") && (
          <section className="space-y-6 pt-6 border-t border-border">
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-1">
                Operational & UX States Sandbox
              </h2>
              <p className="text-xs text-text-secondary">
                Demonstrating first-class state handling for quiet sessions, data staleness, and provider interruptions.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-text-primary block mb-2">
                  1. Quiet State (Valid Product State — No Abnormal Divergence)
                </span>
                <QuietState
                  checkpointTime="10:15 AM IST (4h ago)"
                  instrumentsCount={12}
                  benchmarkName="NIFTY 50"
                  onViewWatchlist={() => console.log("Navigate to Watchlist")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-text-primary block mb-2">
                    2. Market Data Provider Interruption
                  </span>
                  <ErrorState
                    type="PROVIDER_UNAVAILABLE"
                    lastKnownSnapshotTime="10:15 AM IST"
                    onRetry={() => console.log("Retry connection")}
                  />
                </div>

                <div>
                  <span className="text-xs font-semibold text-text-primary block mb-2">
                    3. Stale / Delayed Quotes Warning
                  </span>
                  <ErrorState
                    type="DATA_STALE"
                    onRetry={() => console.log("Refresh quotes")}
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-text-primary block mb-2">
                  4. Loading & Skeleton Treatments (Financial Shimmer)
                </span>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChangeInsightSkeleton />
                  <WatchlistTableSkeleton count={3} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: TYPOGRAPHY HIERARCHY */}
        {(activeTab === "overview" || activeTab === "typography") && (
          <section className="space-y-4 pt-6 border-t border-border">
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-1">
                Typography Scale & Numbers
              </h2>
              <p className="text-xs text-text-secondary">
                Geist sans-serif paired with tabular financial monospace for prices, percentages, and metrics.
              </p>
            </div>

            <Card className="p-5 bg-surface border-border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-border-subtle">
                <div>
                  <div className="text-[11px] text-text-muted uppercase font-mono">Page Title</div>
                  <div className="text-2xl font-bold tracking-tight text-text-primary">
                    Your TRACE
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-text-muted uppercase font-mono">Section Heading</div>
                  <div className="text-base font-semibold text-text-primary">
                    Meaningful Changes
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-text-muted uppercase font-mono">Symbol / Ticker</div>
                  <div className="text-sm font-bold font-mono text-text-primary uppercase tracking-wide">
                    TATAMOTORS
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div>
                  <div className="text-[11px] text-text-muted uppercase font-mono">Price (Large)</div>
                  <div className="text-xl font-semibold font-mono tabular-nums text-text-primary">
                    ₹1,042.50
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-text-muted uppercase font-mono">Positive Delta</div>
                  <div className="text-sm font-semibold font-mono tabular-nums text-positive">
                    +4.85% (+48.20)
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-text-muted uppercase font-mono">Negative Delta</div>
                  <div className="text-sm font-semibold font-mono tabular-nums text-negative">
                    -2.35% (-43.80)
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-text-muted uppercase font-mono">Timestamp / Tag</div>
                  <div className="text-xs text-text-muted font-mono">
                    10:15:22 IST
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* SECTION 4: COLOR TOKENS */}
        {(activeTab === "overview" || activeTab === "colors") && (
          <section className="space-y-4 pt-6 border-t border-border">
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-1">
                Color Tokens & Palette
              </h2>
              <p className="text-xs text-text-secondary">
                Deep Rose / Ink brand identity strictly decoupled from semantic market state colors.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-[4px] bg-background border border-border space-y-1">
                <div className="h-6 rounded bg-[#0e0c0d] border border-border" />
                <div className="text-[11px] font-semibold text-text-primary">Background</div>
                <div className="text-[10px] text-text-muted font-mono">#0e0c0d</div>
              </div>

              <div className="p-3 rounded-[4px] bg-surface border border-border space-y-1">
                <div className="h-6 rounded bg-[#1b1719] border border-border" />
                <div className="text-[11px] font-semibold text-text-primary">Surface</div>
                <div className="text-[10px] text-text-muted font-mono">#1b1719</div>
              </div>

              <div className="p-3 rounded-[4px] bg-surface border border-border space-y-1">
                <div className="h-6 rounded bg-[#9e5560]" />
                <div className="text-[11px] font-semibold text-text-primary">Brand Primary</div>
                <div className="text-[10px] text-text-muted font-mono">Deep Rose</div>
              </div>

              <div className="p-3 rounded-[4px] bg-surface border border-border space-y-1">
                <div className="h-6 rounded bg-[#22c55e]" />
                <div className="text-[11px] font-semibold text-positive">Market Gain</div>
                <div className="text-[10px] text-text-muted font-mono">#22c55e</div>
              </div>

              <div className="p-3 rounded-[4px] bg-surface border border-border space-y-1">
                <div className="h-6 rounded bg-[#f43f5e]" />
                <div className="text-[11px] font-semibold text-negative">Market Loss</div>
                <div className="text-[10px] text-text-muted font-mono">#f43f5e</div>
              </div>

              <div className="p-3 rounded-[4px] bg-surface border border-border space-y-1">
                <div className="h-6 rounded bg-[#f59e0b]" />
                <div className="text-[11px] font-semibold text-warning">Warning / Stale</div>
                <div className="text-[10px] text-text-muted font-mono">#f59e0b</div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: UI PRIMITIVES */}
        {(activeTab === "overview" || activeTab === "primitives") && (
          <section className="space-y-4 pt-6 border-t border-border">
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-1">
                UI Primitives
              </h2>
              <p className="text-xs text-text-secondary">
                Restrained buttons, badges, significance tags, inputs, and structured evidence rows.
              </p>
            </div>

            <Card className="p-5 bg-surface border-border space-y-6">
              {/* Buttons */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-text-primary">Button Variants</div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="default">Primary Rose</Button>
                  <Button variant="secondary">Secondary Surface</Button>
                  <Button variant="outline">Hairline Outline</Button>
                  <Button variant="ghost">Ghost Action</Button>
                  <Button variant="danger">Danger Action</Button>
                  <Button variant="default" size="sm">Small</Button>
                  <Button variant="default" size="lg">Large</Button>
                </div>
              </div>

              {/* Badges & Significance Tiers */}
              <div className="space-y-2 pt-3 border-t border-border-subtle">
                <div className="text-xs font-semibold text-text-primary">Significance Indicators & Status Badges</div>
                <div className="flex flex-wrap items-center gap-2">
                  <SignificanceIndicator tier="NORMAL" score={18} showScore />
                  <SignificanceIndicator tier="NOTABLE" score={48} showScore />
                  <SignificanceIndicator tier="SIGNIFICANT" score={72} showScore />
                  <SignificanceIndicator tier="MAJOR" score={89} showScore />
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <FreshnessStatus status="FRESH" lastUpdated="14s ago" />
                  <FreshnessStatus status="DELAYED" delayMinutes={15} />
                  <FreshnessStatus status="STALE" lastUpdated="28m ago" />
                  <FreshnessStatus status="UNAVAILABLE" />
                </div>
              </div>

              {/* Evidence Rows */}
              <div className="space-y-2 pt-3 border-t border-border-subtle">
                <div className="text-xs font-semibold text-text-primary">Structured Evidence Rows</div>
                <div className="max-w-md bg-background-elevated p-3 rounded-[4px] border border-border">
                  <EvidenceRow
                    type="PRICE_DELTA"
                    label="Price Movement Since Checkpoint"
                    value="+4.85%"
                    subtext="+₹48.20 per share"
                    divergence="positive"
                  />
                  <EvidenceRow
                    type="BENCHMARK_RELATIVE"
                    label="Performance vs NIFTY 50 (+0.45%)"
                    value="+4.40 pts"
                    subtext="Stock-specific alpha"
                    divergence="positive"
                  />
                  <EvidenceRow
                    type="VOLUME_RATIO"
                    label="Volume Anomaly Ratio"
                    value="3.1×"
                    subtext="2.4M vs 780K baseline"
                  />
                  <EvidenceRow
                    type="ELAPSED_TIME"
                    label="Time Elapsed Since Checkpoint"
                    value="4h 15m"
                    subtext="10:15 AM to 2:30 PM"
                  />
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </AppShell>
  );
}
