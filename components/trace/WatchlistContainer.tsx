"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  OverviewData,
  addInstrumentAction,
  removeInstrumentAction,
  refreshOverviewAction,
} from "@/app/actions/trace";
import { InstrumentRow } from "./InstrumentRow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";

const POPULAR_INDIAN_EQUITIES = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys Ltd", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", exchange: "NSE" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", exchange: "NSE" },
  { symbol: "ITC", name: "ITC Ltd", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", exchange: "NSE" },
  { symbol: "LT", name: "Larsen & Toubro Ltd", exchange: "NSE" },
];

interface WatchlistContainerProps {
  initialData: OverviewData;
}

export function WatchlistContainer({ initialData }: WatchlistContainerProps) {
  const router = useRouter();
  const [data, setData] = React.useState<OverviewData>(initialData);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [customSymbol, setCustomSymbol] = React.useState("");
  const [selectedExchange, setSelectedExchange] = React.useState("NSE");
  const [isAdding, setIsAdding] = React.useState(false);
  const [removingSymbol, setRemovingSymbol] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  React.useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleAddInstrument = async (symbolToAdd: string, exchangeToAdd = "NSE") => {
    const sym = symbolToAdd.trim().toUpperCase();
    if (!sym || !data.watchlist?.id) return;

    setIsAdding(true);
    setFeedback(null);

    try {
      const result = await addInstrumentAction(
        data.watchlist.id,
        sym,
        exchangeToAdd
      );

      if (!result.success) {
        setFeedback({
          type: "error",
          text: result.error || "Failed to add instrument.",
        });
      } else {
        setFeedback({
          type: "success",
          text: `Added ${sym} (${exchangeToAdd}) to your watchlist.`,
        });
        setCustomSymbol("");
        const fresh = await refreshOverviewAction(data.watchlist.id);
        setData(fresh);
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Error communicating with server.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveInstrument = async (symbolToRemove: string, exchange = "NSE") => {
    if (!data.watchlist?.id) return;
    setRemovingSymbol(symbolToRemove);
    setFeedback(null);

    try {
      const result = await removeInstrumentAction(
        data.watchlist.id,
        symbolToRemove,
        exchange
      );

      if (!result.success) {
        setFeedback({
          type: "error",
          text: result.error || "Failed to remove instrument.",
        });
      } else {
        setFeedback({
          type: "success",
          text: `Removed ${symbolToRemove} from your watchlist.`,
        });
        const fresh = await refreshOverviewAction(data.watchlist.id);
        setData(fresh);
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Error removing instrument.",
      });
    } finally {
      setRemovingSymbol(null);
    }
  };

  const itemsList = data.watchlist?.items || [];
  const currentSymbols = new Set(
    itemsList.map((i) => i.symbol.toUpperCase())
  );

  const filteredItems = itemsList.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.symbol.toLowerCase().includes(query) ||
      (item.displayName && item.displayName.toLowerCase().includes(query))
    );
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner Feedback */}
      {feedback && (
        <div
          role="status"
          className={`p-3 rounded-[4px] border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-positive/10 border-positive/30 text-positive"
              : "bg-negative/10 border-negative/30 text-negative"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
              Watchlist Management
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-[11px] text-text-muted font-mono">
              {itemsList.length} Instruments
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            {data.watchlist?.name || "Main Watchlist"}
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Manage instruments tracked by TRACE memory baselines.
          </p>
        </div>
      </div>

      {/* Add Instrument Card */}
      <Card className="p-4 sm:p-5 bg-background-elevated border-border space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-secondary">
          <Plus className="h-4 w-4 text-brand-accent" />
          <span>Add Instrument to Watchlist</span>
        </div>

        {/* Custom Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddInstrument(customSymbol, selectedExchange);
          }}
          className="flex flex-col sm:flex-row items-center gap-2.5"
        >
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-muted">
              <Search className="h-3.5 w-3.5" />
            </div>
            <Input
              type="text"
              placeholder="e.g. RELIANCE, TCS, INFY"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
              className="pl-8 bg-surface border-border text-xs uppercase font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="h-8 px-2.5 rounded-[4px] bg-surface border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>

            <Button
              type="submit"
              disabled={isAdding || !customSymbol.trim()}
              size="sm"
              className="text-xs font-semibold h-8 shrink-0 flex-1 sm:flex-none"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>{isAdding ? "Adding..." : "Add"}</span>
            </Button>
          </div>
        </form>

        {/* Quick Add Suggestions */}
        <div className="space-y-1.5 pt-2 border-t border-border-subtle">
          <span className="text-[10px] uppercase font-mono text-text-muted block">
            Suggested Indian Equities (NIFTY 50 Constituents):
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {POPULAR_INDIAN_EQUITIES.map((stock) => {
              const isAlreadyAdded = currentSymbols.has(stock.symbol);
              return (
                <button
                  key={stock.symbol}
                  type="button"
                  disabled={isAlreadyAdded || isAdding}
                  onClick={() => handleAddInstrument(stock.symbol, stock.exchange)}
                  className={`px-2 py-1 rounded-[3px] text-[11px] font-mono border transition-colors ${
                    isAlreadyAdded
                      ? "bg-surface/50 border-border-subtle text-text-muted cursor-not-allowed opacity-60"
                      : "bg-surface border-border text-text-secondary hover:text-text-primary hover:border-brand-primary/50"
                  }`}
                  title={isAlreadyAdded ? "Already in watchlist" : `Add ${stock.name}`}
                >
                  <span>{stock.symbol}</span>
                  {isAlreadyAdded && <span className="ml-1 text-[9px] text-text-muted">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Filter / Search Active Watchlist */}
      {itemsList.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-muted">
              <Search className="h-3 w-3" />
            </div>
            <Input
              type="text"
              placeholder="Filter watchlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7.5 h-8 bg-surface border-border text-xs"
            />
          </div>
          <span className="text-[11px] text-text-muted font-mono">
            Showing {filteredItems.length} of {itemsList.length}
          </span>
        </div>
      )}

      {/* Watchlist Table / List */}
      {itemsList.length === 0 ? (
        <Card className="p-8 bg-surface border-border text-center space-y-3">
          <Building2 className="h-8 w-8 mx-auto text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">
            No Instruments in Watchlist
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Use the form above to add your first stock to track with TRACE.
          </p>
        </Card>
      ) : (
        <div className="divide-y divide-border-subtle rounded-[4px] border border-border bg-surface/50 overflow-hidden">
          {filteredItems.map((item) => {
            const quote = data.currentQuotes[item.symbol];
            const changeItem = data.changeResult?.changes.find(
              (c) => c.symbol === item.symbol
            );
            const deltaPct =
              changeItem?.evidence.priceDeltaPercent ?? quote?.changePercent ?? 0;

            const isRemoving = removingSymbol === item.symbol;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between hover:bg-surface-active/40 transition-colors group pr-3"
              >
                <div
                  onClick={() =>
                    router.push(`/watchlist/${encodeURIComponent(item.symbol)}`)
                  }
                  className="flex-1 cursor-pointer"
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

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    handleRemoveInstrument(item.symbol, item.exchange)
                  }
                  disabled={isRemoving}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-negative hover:bg-negative/10 h-7 w-7"
                  title={`Remove ${item.symbol} from watchlist`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
