# TRACE — Visual Design System Specification

> **Working Tagline:** "Know what changed. Know what matters."  
> **Challenge:** Code, by Groww 2026 Engineering Challenge  
> **Status:** Authoritative Visual Design System (Phase 3)

---

## 1. Visual Philosophy & Core Identity

TRACE is designed as a **dark-first, premium analytical fintech tool**:

- **Editorial & Analytical:** Information presented with high typographical discipline, akin to an institutional research terminal rather than a generic SaaS template.
- **Calm & Precise:** Neutral dark surfaces, hairline borders, and deliberate use of color accents strictly when market movements demand attention.
- **Signal-First Hierarchy:** The primary view is dominated by the meaningful change feed (**"Your TRACE"**); raw watchlist tables are secondary.
- **Trustworthy & Explainable:** Distinguishes observable market facts from derived interpretations; never presents speculative causal claims.
- **Quiet State as a Success State:** A return visit with no abnormal volatility is celebrated as a calm, reassuring confirmation—not an empty or error state.

---

## 2. Color Palette & Token Architecture

### 2.1 Brand Foundation: Deep Rose / Ink

The TRACE brand identity is built upon an ink canvas paired with restrained deep rose accents.

| Token | CSS Variable | Hex / Value (Dark) | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `background` | `--background` | `#0e0c0d` | Deep ink canvas foundation. |
| `background-elevated` | `--background-elevated`| `#151213` | Elevated navigation and header panels. |
| `surface` | `--surface` | `#1b1719` | Primary card and row container surface. |
| `surface-hover` | `--surface-hover` | `#241f22` | Interactive element hover state. |
| `surface-active` | `--surface-active` | `#2f282c` | Interactive active/pressed state. |
| `border` | `--border` | `#2c2528` | Hairline divider and component boundary. |
| `border-subtle` | `--border-subtle` | `#1f1a1c` | Internal card dividers and subtle rules. |
| `text-primary` | `--text-primary` | `#f6f3f4` | High-contrast body, tickers, and prices. |
| `text-secondary` | `--text-secondary` | `#b0a3a7` | Subheadings, descriptions, and labels. |
| `text-muted` | `--text-muted` | `#786c71` | Timestamps, metadata, and inactive tags. |
| `brand-primary` | `--brand-primary` | `#9e5560` | Primary brand deep rose. |
| `brand-secondary` | `--brand-secondary` | `#c9a0a4` | Accent labels and subtle highlights. |
| `brand-accent` | `--brand-accent` | `#c46c77` | Focus rings and active navigation badges. |
| `brand-surface` | `--brand-surface` | `rgba(158,85,96,0.14)` | Subdued tinted badge backgrounds. |

---

### 2.2 Semantic Market & Operational Colors (Separated from Brand)

> **Critical Rule:** Brand colors and semantic market colors **MUST** remain separate. Upward price movement never uses brand rose; downward movement never uses brand rose.

| Semantic Role | CSS Variable | Color Value | Usage Guidelines |
| :--- | :--- | :--- | :--- |
| **Market Gain (Positive)** | `--positive` | `#22c55e` | Upward price delta, benchmark outperformance, positive alpha. |
| **Market Loss (Negative)** | `--negative` | `#f43f5e` | Downward price delta, benchmark underperformance, negative alpha. |
| **Warning / Attention** | `--warning` | `#f59e0b` | High-volatility alerts, provider latency, non-blocking warnings. |
| **Stale / Delayed** | `--stale` | `#d97706` | Data exceeding refresh threshold or 15m exchange delay tag. |
| **Error / Interruption** | `--error` | `#ef4444` | Upstream provider disconnects, failed symbol queries. |
| **Informational** | `--info` | `#60a5fa` | Neutral metadata tags, system notifications. |

---

## 3. Typography Hierarchy & Financial Numerals

### 3.1 Typeface: Geist Sans & Monospace
- **Primary Font:** Geist Sans (`--font-sans`) for clean legibility across interface labels, headings, and narratives.
- **Quantitative / Monospace Font:** Geist Mono (`--font-mono` / `tabular-nums`) for prices, percentages, volumes, timestamps, and ticker symbols.

### 3.2 Scale & Hierarchy

| Role | Class / Size | Weight | Font Family | Example |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `text-xl` to `text-2xl` | Bold (700) | Geist Sans / Mono | `Your TRACE` |
| **Section Heading** | `text-sm` to `text-base` | Semi-bold (600) | Geist Sans | `Meaningful Changes` |
| **Instrument Symbol** | `text-sm` to `text-lg` | Bold (700) | Geist Mono | `TATAMOTORS` |
| **Large Price** | `text-lg` to `text-xl` | Semi-bold (600) | Geist Mono (Tabular) | `₹1,042.50` |
| **Percentage Delta** | `text-xs` to `text-sm` | Semi-bold (600) | Geist Mono (Tabular) | `+4.85% (+48.20)` |
| **Body / Explanations** | `text-xs` to `text-sm` | Regular (400) | Geist Sans | *"Volume is 3.1x typical..."* |
| **Metadata & Badges** | `text-[10px]` to `text-xs` | Medium (500) | Geist Mono / Sans | `Since 10:15 AM · Live` |

---

## 4. Spacing, Borders & Radius Scale

### 4.1 Restrained Spacing Scale
Consistent 4px / 8px incremental scale:
`4px` (`gap-1`), `8px` (`gap-2`), `12px` (`gap-3`), `16px` (`gap-4`), `24px` (`gap-6`), `32px` (`gap-8`), `48px` (`gap-12`), `64px` (`gap-16`).

### 4.2 Restrained Radius Scale
- `4px` (`rounded-[4px]`): Buttons, inputs, badges, status pills, table rows.
- `6px` (`rounded-[6px]`): Card containers, modal sheets, drawer panels.
- `12px` (`rounded-[12px]`): Maximum boundary radius for full-page dialogs.
- *(Overly rounded bubbly containers like `rounded-3xl` are strictly prohibited).*

### 4.3 Hairline Borders over Heavy Shadows
TRACE relies on 1px subtle hairline borders (`border-border` / `border-border-subtle`) for visual structure rather than diffuse drop shadows. Shadows are limited to micro-elevation on hovered cards.

---

## 5. Core Component Architecture

The design system provides reusable components in `components/trace/` and `components/ui/`:

### 5.1 Flagship Component: `ChangeInsight`
The core component of the TRACE experience. It encapsulates:
1. **Significance Tier Indicator:** `NORMAL`, `NOTABLE`, `SIGNIFICANT`, or `MAJOR`.
2. **Instrument Identifier:** Uppercase mono symbol + official company name.
3. **Current Price & Checkpoint Delta:** Price with positive/negative color coding and absolute delta.
4. **Contextual Signal Pills:** Divergence against NIFTY 50 and volume anomaly multiplier.
5. **Structured Reasons List:** Bulleted factual observations explaining why TRACE flagged the movement.
6. **Time Context & Freshness:** Checkpoint time delta and live/delayed status.
7. **Action CTA:** Secondary "View Details →" button for drill-down.

### 5.2 Watchlist Row: `InstrumentRow`
Compact list row with symbol, name, LTP, checkpoint delta, subtle mini sparkline placeholder, and status tag.

### 5.3 Status & Freshness: `FreshnessStatus`
Communicates data trust across `FRESH`, `DELAYED`, `STALE`, and `UNAVAILABLE` using **text labels + icons + color dots** (never color alone).

### 5.4 Significance Indicator: `SignificanceIndicator`
Standardized badges for `NORMAL`, `NOTABLE`, `SIGNIFICANT`, and `MAJOR` tiers with optional normalized score display.

### 5.5 Structured Evidence: `EvidenceRow`
Modular two-column metric row for price delta, volume ratio, volatility expansion, and elapsed time.

### 5.6 Quiet State: `QuietState`
Understated, reassuring card confirming that all watchlist instruments are behaving normally within expected volatility bands.

### 5.7 Financial Skeletons: `LoadingState`
Calm shimmer skeletons mirroring exact layout geometry without intrusive full-page spinners.

### 5.8 Graceful Degraded States: `ErrorState`
Restrained alert cards explaining provider disconnects or data staleness with retry actions and last known snapshot timestamps.

### 5.9 App Shell & Navigation: `AppShell`, `Sidebar`, `MobileNav`
Restrained desktop sidebar navigation paired with responsive mobile header drawer and compact bottom bar.

---

## 6. Responsive Principles

- **Desktop (>= 1024px):** Fixed left sidebar (`w-64`), multi-column change feed, side-by-side metric evidence breakdown.
- **Tablet (768px – 1023px):** Compact sidebar (`w-56`), stacked change insight layout, full-width watchlist tables.
- **Mobile (< 768px):** Sticky top header with brand logo, slide-out navigation drawer, compact bottom navigation bar, single-column change feed with touch-friendly 44px hit targets.

---

## 7. Accessibility & Inclusive Design

- **Color Contrast:** All text tokens meet WCAG AA contrast standards ($\ge 4.5:1$ for body, $\ge 3:1$ for large headings).
- **Multi-Modal Status:** Freshness and market movements are conveyed through text + icons + color (never color alone).
- **Keyboard Navigation:** Explicit visible focus rings (`focus-visible:ring-1 focus-visible:ring-brand-accent`).
- **Motion Reduction:** All transitions respect `prefers-reduced-motion: reduce`.

---

## 8. Chart & Data Visualization Rules (For Future Implementation)

1. **Information over Decoration:** Charts must convey price trajectory and baseline checkpoints, not ornamental background fill.
2. **Minimal Gridlines:** Faint horizontal price rules only; no vertical grid noise.
3. **Benchmark Overlay:** Reference index (NIFTY 50) rendered as a subtle dashed neutral line.
4. **Zero Pseudo-3D or Neon Glow:** Crisp 1.5px vector strokes with subtle area opacity ($\le 10\%$).

---

## 9. Explicit Anti-Patterns (What TRACE Avoids)

- ❌ No purple AI gradients or glowing neon buttons.
- ❌ No floating frosted glassmorphism cards.
- ❌ No giant rounded `rounded-3xl` cards with empty whitespace.
- ❌ No "AI Insights ✨" generative sparkle branding.
- ❌ No generic card grids where every stock looks identical.
- ❌ No fake charts or decorative stock photos.
