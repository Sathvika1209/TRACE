import Link from "next/link";
import { AppShell } from "@/components/trace/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Palette, Layers } from "lucide-react";

export default function HomePage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="brand" size="sm">
                PHASE 3 · DESIGN SYSTEM
              </Badge>
              <span className="text-[11px] text-text-muted font-mono">
                Indian Equities · NIFTY 50
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary font-mono">
              TRACE
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              &ldquo;Know what changed. Know what matters.&rdquo;
            </p>
          </div>
        </div>

        {/* Phase 3 Design System Prompt Card */}
        <Card className="p-6 sm:p-8 bg-background-elevated border-border text-left space-y-4">
          <div className="flex items-center gap-2.5 text-xs text-brand-secondary font-mono uppercase font-semibold">
            <Palette className="h-4 w-4 text-brand-accent" />
            <span>Visual Design Foundation Established</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
            Explore the Interactive Design Showcase
          </h2>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl">
            Phase 3 formalizes the <strong>Deep Rose / Ink</strong> visual design system, dark-first design tokens, typography scale, UI primitives, and representative components (including the flagship <code>ChangeInsight</code> card, <code>InstrumentRow</code> watchlist items, data trust indicators, and <code>QuietState</code>).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/design-system">
              <Button variant="default" size="default" className="text-xs font-semibold">
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                <span>Open Design Showcase (/design-system)</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Core Product Thesis Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <Card className="p-4 bg-surface border-border space-y-1.5">
            <div className="text-[11px] text-text-muted font-mono uppercase">1. Checkpoint Memory</div>
            <div className="font-semibold text-text-primary">What changed while away?</div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Compares market state against discrete user baselines instead of raw 24h close.
            </p>
          </Card>

          <Card className="p-4 bg-surface border-border space-y-1.5">
            <div className="text-[11px] text-text-muted font-mono uppercase">2. Multi-Signal Scoring</div>
            <div className="font-semibold text-text-primary">Deterministic & Explainable</div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Price delta, volume anomalies, and NIFTY 50 divergence scored mathematically.
            </p>
          </Card>

          <Card className="p-4 bg-surface border-border space-y-1.5">
            <div className="text-[11px] text-text-muted font-mono uppercase">3. Information over Noise</div>
            <div className="font-semibold text-text-primary">Restrained Fintech Aesthetic</div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Zero purple AI gradients or glassmorphism clutter; pure verifiable market signal.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
