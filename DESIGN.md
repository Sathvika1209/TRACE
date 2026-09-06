# TRACE — Design System Specification

---

## 1. Intended Visual Direction

TRACE is designed with a **premium, restrained fintech aesthetic**:

- **Analytical & Precise:** Numbers, tickers, and deltas take center stage with high typographical hierarchy.
- **Calm & Focused:** Low visual noise, neutral backgrounds, and deliberate use of color accents only for meaningful data changes.
- **Trustworthy & Modern:** Clear boundaries, subtle hairline borders, and crisp alignment inspire confidence in financial data.
- **Balanced Density:** High information density in data tables and change feeds, paired with disciplined breathing room around key actions.

---

## 2. Design Principles & Anti-Patterns

### Core Principles
1. **Information over Decoration:** Every visual element must serve comprehension. If an element does not convey market state or change context, remove it.
2. **Deterministic Feedback:** Visual indicators must reflect exact mathematical states (e.g., green/red for positive/negative delta, amber for stale data).
3. **Restrained Motion:** Animations are limited to functional micro-transitions (tab switches, loading state transitions). Zero distracting motion.

### Explicit Anti-Patterns (What We Avoid)
- **NO Purple AI Gradients:** Avoid trendy purple-indigo gradients and "AI sparkle" branding.
- **NO Excessive Glassmorphism:** Avoid heavy backdrop blurs, floating glass cards, and high-opacity frosted glass layers.
- **NO Giant Rounded Cards:** Avoid overly bubbly border-radius (e.g. `rounded-3xl` everywhere) that wastes space.
- **NO Excessive Shadows:** Favor subtle 1px border lines over floating drop shadows.
- **NO Fake AI Widgets:** No generative "AI chat bubbles" masquerading as market analysis.

---

## 3. Typography Direction (Placeholder)

> *Note: Final font selections will be validated in a dedicated design phase. The current configuration uses clean, neutral system/modern sans and monospace fonts.*

- **Body & Headings:** Neutral, high-legibility geometric or humanist sans-serif (e.g. Geist, Inter, or system sans-serif).
- **Tabular & Financial Data:** Monospace or tabular figures (`font-mono` / `tabular-nums`) for prices, percentages, volumes, and timestamps to ensure vertical column alignment across changing figures.
- **Scale:**
  - Display / Hero numbers: `text-2xl` to `text-3xl` (semi-bold)
  - Section headers: `text-base` to `text-lg` (medium)
  - Data labels & body: `text-sm` (regular / medium)
  - Metadata & timestamps: `text-xs` (neutral muted)

---

## 4. Color System Philosophy & Placeholders

> *Note: Final color palette tokens will be generated and refined deliberately using Realtime Colors in the subsequent design phase. No final colors are locked in Phase 1.*

### Token Taxonomy (Semantic Variables)

| Token Role | Semantic Purpose | Placeholder Base |
| :--- | :--- | :--- |
| `background` | Canvas foundation | Pure/off-neutral (`#ffffff` light / `#0a0a0a` dark) |
| `foreground` | Primary text and headings | High-contrast neutral (`#171717` light / `#ededed` dark) |
| `muted` / `subtle` | Secondary labels, timestamps, icons | Mid-tone neutral (`#737373` / `#a3a3a3`) |
| `border` / `hairline` | Subtle dividers and card outlines | Hairline neutral (`#e5e5e5` light / `#262626` dark) |
| `positive` (Gain) | Indicates upward price movement | Clean, restrained green (non-neon) |
| `negative` (Loss) | Indicates downward price movement | Clean, restrained red/rose (non-neon) |
| `warning` / `stale` | Stale data, delayed quotes, or warning state | Restrained amber/warm gold |
| `accent` | Selected states, primary focus ring | Controlled monochrome or neutral accent |

---

## 5. Spacing & Layout Principles

- **Grid & Alignment:** Consistent 4px / 8px grid system (`gap-2`, `gap-4`, `gap-6`, `p-4`, `p-6`).
- **Compact Data Rows:** Vertical padding in list items and tables kept lean (`py-2.5` to `py-3`) for optimal scan speed.
- **Clear Scannability:** Group related data hierarchically: `[Symbol + Name] -> [Current Price + Checkpoint Delta] -> [Significance Badge + Reasons]`.

---

## 6. Component Philosophy

- **Foundation:** Built on top of `shadcn/ui` primitives (Radix UI headless components + Tailwind CSS).
- **Small & Composable:** Complex views (e.g., Change Feed) are assembled from single-purpose, pure presentational components.
- **Separation of Concerns:** Components receive typed props and emit events; zero direct database queries or mathematical engine algorithms inside components.

---

## 7. Interaction Philosophy

- **Immediate Clarity:** On loading TRACE, the user's eye should immediately land on the top 3 most significant changes since their previous checkpoint.
- **Progressive Disclosure:** High-level summary badges and structured reasons are visible upfront; deep historical drill-downs and quote breakdowns are revealed on click/expansion.
- **Explicit Checkpoint Status:** A prominent, understated status badge communicates baseline checkpoint time (e.g., *"Comparing against today, 10:15 AM"*).

---

## 8. Required UI States (For Phase 2 Implementation)

The design system must explicitly cater to these states:

1. **Active / Fresh State:** Live or fresh market quotes with clear checkpoint comparisons.
2. **Stale / Delayed Data State:** Clear visual indicator when market data provider has not updated within threshold or during market closure.
3. **Empty Watchlist State:** Actionable onboarding prompt encouraging user to add their first instruments.
4. **No Significant Changes State:** Reassuring, calm message when watchlist movements fall below significance thresholds (e.g., *"No unusual divergence detected since 11:30 AM"*).
5. **Loading & Skeleton State:** Precise structural skeletons mirroring exact table/feed layout without layout shifts.
6. **Error / Degraded State:** Non-intrusive warning banners explaining API connectivity issues with fallback to last known snapshot.
