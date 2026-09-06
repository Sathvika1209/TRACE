# TRACE — System Architecture

---

## 1. Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router, React 19) | Server-first rendering, React Server Components (RSC), streaming, Route Handlers, and Server Actions. |
| **Language** | TypeScript (Strict Mode) | Strong type safety across domain entities, server boundaries, and client UI. |
| **Styling** | Tailwind CSS (v4) | Utility-first, predictable styling with theme tokens and minimal CSS footprint. |
| **Component Foundation** | shadcn/ui + Lucide Icons | Accessible, composable, headless primitives without vendor lock-in or heavyweight UI frameworks. |
| **Database & Auth** | Supabase (PostgreSQL + Auth + SSR) | Managed PostgreSQL with Row-Level Security (RLS), native cookie-based SSR auth, and snapshot storage. |
| **Deployment** | Vercel | Seamless Next.js deployment, edge routing, and environment management. |
| **Repository** | Git / GitHub | Clean commit history and branch control. |

---

## 2. High-Level System Architecture

TRACE is structured as a **modular monolith** within Next.js. Business logic is isolated on the server layer, completely decoupled from React presentation components.

```text
                                  ┌────────────────────────┐
                                  │      Client (Browser)  │
                                  └───────────┬────────────┘
                                              │ HTTP / RSC / Actions
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ Next.js App Router (Server Boundary)                                                       │
│                                                                                             │
│  ┌────────────────────┐   ┌───────────────────────┐   ┌──────────────────────────────────┐  │
│  │ Route Handlers     │   │ Server Actions        │   │ React Server Components (RSC)    │  │
│  └─────────┬──────────┘   └───────────┬───────────┘   └────────────────┬─────────────────┘  │
│            │                          │                                │                    │
│            └──────────────────────────┼────────────────────────────────┘                    │
│                                       ▼                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Server Domain Layer (server/)                                                         │  │
│  │                                                                                       │  │
│  │  ┌─────────────────────┐   ┌──────────────────────┐   ┌────────────────────────────┐  │  │
│  │  │ Watchlist Service   │   │ Checkpoint Service   │   │ Meaningful Change Engine   │  │  │
│  │  └──────────┬──────────┘   └──────────┬───────────┘   └─────────────┬──────────────┘  │  │
│  │             │                         │                             │                 │  │
│  │             └─────────────────────────┼─────────────────────────────┘                 │  │
│  │                                       ▼                                               │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ Market Data Service Abstraction (server/market/)                                │  │  │
│  │  └────────────────────────────────────┬────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────┼───────────────────────────────────────────────┘  │
└──────────────────────────────────────────┼──────────────────────────────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
       ┌─────────────────────────┐                   ┌────────────────────────┐
       │ Supabase (PostgreSQL)   │                   │ External Market Data   │
       │  • User Profiles        │                   │  • Indian Equities     │
       │  • Watchlists & Items   │                   │  • NIFTY 50 Benchmark  │
       │  • Checkpoints & State  │                   │  • Volume & Volatility │
       │  • Snapshots (Atomic)   │                   └────────────────────────┘
       │  • Strict RLS Isolation │
       └─────────────────────────┘
```

---

## 3. Database Schema & Persistence Architecture (Phase 4)

### 3.1 Relational Ownership Model

```text
auth.users (Supabase Auth)
    │
    ▼ (1:1)
public.profiles
    │
    └── (1:N) public.watchlists
                  │
                  ├── (1:N) public.watchlist_instruments (Unique: watchlist_id + symbol + exchange)
                  │
                  └── (1:N) public.checkpoints (User Memory Baselines)
                                │
                                └── (1:N) public.checkpoint_snapshots (Observed Market State)
```

### 3.2 Core Table Specifications

1. **`profiles`:** Stores user-specific settings and preferences without duplicating auth credentials (`id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`).
2. **`watchlists`:** Named collections of instruments belonging to users (`id UUID PRIMARY KEY`, `user_id UUID REFERENCES auth.users(id)`, `name TEXT`, `is_default BOOLEAN`).
3. **`watchlist_instruments`:** Normalized equity instruments mapped to watchlists (`watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE`, `symbol TEXT`, `exchange TEXT DEFAULT 'NSE'`, `display_name TEXT`, `display_order INTEGER`). Enforces `UNIQUE(watchlist_id, symbol, exchange)`.
4. **`checkpoints`:** Discrete baseline snapshot events representing when a user observed their watchlist (`id UUID PRIMARY KEY`, `user_id UUID`, `watchlist_id UUID`, `created_at TIMESTAMPTZ`, `metadata JSONB`).
5. **`checkpoint_snapshots`:** Granular observed market metrics for each instrument at a checkpoint (`checkpoint_id UUID REFERENCES checkpoints(id) ON DELETE CASCADE`, `symbol TEXT`, `exchange TEXT`, `price NUMERIC(14,4)`, `price_timestamp TIMESTAMPTZ`, `volume BIGINT`, `day_high`, `day_low`, `day_open`, `previous_close`, `data_status TEXT`).

### 3.3 Data Types & Numeric Precision Strategy
- **Prices & Deltas:** Stored as `NUMERIC(14, 4)` to prevent floating-point rounding errors common with financial figures.
- **Trading Volume:** Stored as `BIGINT` (supporting multi-billion share volume counts).
- **Timestamps:** Exclusively stored as `TIMESTAMPTZ` in UTC. Timezone conversions happen strictly on presentation layer based on user locale.
- **Null Preservation:** Missing or unquoted metrics remain `NULL` (never fabricated into `0`).

---

## 4. Row-Level Security (RLS) Strategy

Row-Level Security is **mandatory** and enabled on all 5 public tables. Application-level filtering is never solely relied upon for data privacy.

| Table | SELECT Policy | INSERT / UPDATE / DELETE Policy |
| :--- | :--- | :--- |
| `profiles` | `auth.uid() = id` | `auth.uid() = id` |
| `watchlists` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `watchlist_instruments` | Subquery joins `watchlists.user_id = auth.uid()` | Subquery joins `watchlists.user_id = auth.uid()` |
| `checkpoints` | `auth.uid() = user_id` | `auth.uid() = user_id AND watchlists.user_id = auth.uid()` |
| `checkpoint_snapshots` | Subquery joins `checkpoints.user_id = auth.uid()` | Subquery joins `checkpoints.user_id = auth.uid()` |

---

## 5. Checkpoint Transactional Atomicity

To eliminate partial checkpoint states (e.g., checkpoint row inserted but network drops before all snapshots are written), checkpoint creation is encapsulated within an atomic PostgreSQL stored procedure:

```sql
CREATE OR REPLACE FUNCTION public.create_checkpoint_with_snapshots(
  p_watchlist_id UUID,
  p_snapshots JSONB,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID;
```

This ensures that:
- Checkpoint header creation and all instrument snapshot rows execute inside a single transactional block (`BEGIN ... COMMIT`).
- Watchlist ownership is validated within PostgreSQL security context.
- If any snapshot fails insertion, the entire checkpoint transaction rolls back cleanly.

---

## 6. Indexing & Query Optimization

Indexes are established specifically for foreign-key traversal and chronological lookups:
- `idx_watchlists_user_id` on `watchlists(user_id)`
- `idx_watchlist_instruments_watchlist_id` on `watchlist_instruments(watchlist_id)`
- `idx_checkpoints_user_watchlist` on `checkpoints(user_id, watchlist_id, created_at DESC)`
- `idx_checkpoint_snapshots_checkpoint_id` on `checkpoint_snapshots(checkpoint_id)`
- `idx_checkpoint_snapshots_symbol_exchange` on `checkpoint_snapshots(symbol, exchange)`

---

## 7. User Onboarding & Default Watchlist Strategy

1. **Database Trigger Automation:** The PostgreSQL trigger `on_auth_user_created` on `auth.users` automatically provisions a `profiles` record and creates a default primary watchlist (`Main Watchlist`, `is_default = true`).
2. **Server-Side Fallback:** [`WatchlistService.getOrCreateDefaultWatchlist()`](file:///c:/Users/Sathvika/Documents/antigravity/modest-hertz/server/watchlist/service.ts) ensures that even if trigger execution is skipped in local mocking or migration edge cases, the application lazily provisions the user's primary watchlist.

---

## 8. Market Data Provider Architecture (Phase 5)

TRACE interfaces with external market data feeds through a strictly decoupled provider abstraction layer located in `server/market/`.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Market Data Service Boundary (server/market/service.ts)                     │
│                                                                             │
│  • In-Memory Short-Lived Caching (30s Quotes / Benchmark, 1h Baselines)     │
│  • Batching & Symbol Case Normalization                                     │
│  • Per-Instrument Error Isolation & Graceful Fallback                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
   ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
   │ YahooMarketDataProvider         │   │ MockMarketDataProvider          │
   │  • Real-time Indian Equities    │   │  • Deterministic Indian Stocks  │
   │    (.NS / .BO suffixes)         │   │  • Configurable Overrides       │
   │  • NIFTY 50 Benchmark (^NSEI)   │   │  • Fixed-Time Testing Support   │
   │  • 20-Day Baseline Calculation  │   │  • 100% Offline Test Execution  │
   │  • 4s Request Timeout & Status  │   │  • Safe Unknown-Symbol Default  │
   └─────────────────────────────────┘   └─────────────────────────────────┘
```

### 8.1 Provider Interface (`IMarketDataProvider`)

```typescript
export interface IMarketDataProvider {
  readonly name: string;
  getQuotes(symbols: string[], exchange?: string): Promise<Record<string, MarketQuote>>;
  getHistoricalData(symbol: string, range?: "5d" | "1mo" | "3mo" | "1y"): Promise<HistoricalBar[]>;
  getBenchmarkQuote(): Promise<BenchmarkQuote | null>;
  getBaselineMetrics(symbol: string): Promise<InstrumentBaseline | null>;
}
```

### 8.2 Data Trust & Freshness Hierarchy

Every market quote carries a mandatory `dataStatus` tag based on quote timestamp age and connectivity:

1. **`FRESH`:** Live real-time quote updated within current market hours.
2. **`DELAYED`:** Free exchange feeds typically subject to standard 15-minute dissemination delay or end-of-day close (<24 hours).
3. **`STALE`:** Last trade data is older than 24 hours (holidays, suspended trading, or network lag). Flagged with structured code `DATA_STALE`.
4. **`UNAVAILABLE`:** Upstream provider timeout, unlisted symbol, or halted instrument. Stored with explicit `null` numeric values (never converted to 0) and flagged with `DATA_UNAVAILABLE`.

---

## 9. Deterministic Meaningful Change Engine (Phase 5)

The Meaningful Change Engine (`server/change-engine/engine.ts`) is the analytical core of TRACE. It evaluates what changed between a user's checkpoint and the current market state using pure, explainable mathematics.

### 9.1 Multi-Signal Mathematical Scoring Model

The overall **Significance Score** ($S \in [0, 100]$) is computed as a weighted composite of four independent market signals:

$$S = \min\left(100, S_{\text{price}} + S_{\text{bench}} + S_{\text{vol}} + S_{\text{volat}}\right)$$

#### 1. Price Delta Magnitude ($S_{\text{price}}$, Max 40 pts)
Normalizes price movement relative to the instrument's historical 20-day daily volatility ($\sigma_{\text{base}}$):
$$\text{moveRatio} = \frac{|\Delta P\%|}{\sigma_{\text{base}}}$$
$$S_{\text{price}} = \begin{cases} 0 & \text{if } \text{moveRatio} \le 0.5 \\ \min(40, \text{round}((\text{moveRatio} - 0.5) \times 16)) & \text{if } \text{moveRatio} > 0.5 \end{cases}$$

#### 2. Benchmark Divergence ($S_{\text{bench}}$, Max 30 pts)
Measures divergence against the NIFTY 50 market benchmark ($\Delta B\%$):
$$\text{relPerf} = \Delta P\% - \Delta B\%$$
$$S_{\text{bench}} = \begin{cases} 0 & \text{if } |\text{relPerf}| \le 0.5 \\ \min(30, \text{round}((|\text{relPerf}| - 0.5) \times 10)) & \text{if } |\text{relPerf}| > 0.5 \end{cases}$$

#### 3. Volume Anomaly Ratio ($S_{\text{vol}}$, Max 20 pts)
Evaluates current trading volume ($V_{\text{curr}}$) against the 20-day average baseline volume ($V_{\text{avg}}$):
$$\text{volRatio} = \frac{V_{\text{curr}}}{V_{\text{avg}}}$$
$$S_{\text{vol}} = \begin{cases} 0 & \text{if } \text{volRatio} \le 1.2 \\ \min(20, \text{round}((\text{volRatio} - 1.2) \times 11)) & \text{if } \text{volRatio} > 1.2 \end{cases}$$

#### 4. Intraday Volatility / Range Expansion ($S_{\text{volat}}$, Max 10 pts)
Measures expansion of today's high-low range relative to historical intraday range:
$$\text{rangeRatio} = \frac{(\text{High} - \text{Low}) / \text{Open}}{\text{avgRangePct}}$$
$$S_{\text{volat}} = \begin{cases} 0 & \text{if } \text{rangeRatio} \le 1.3 \\ \min(10, \text{round}((\text{rangeRatio} - 1.3) \times 8)) & \text{if } \text{rangeRatio} > 1.3 \end{cases}$$

---

### 9.2 Significance Tiers & Thresholds

| Score Range | Tier | Definition | UI Treatment |
| :--- | :--- | :--- | :--- |
| **0 – 29** | `NORMAL` | Within expected noise and historical variance. | Muted badge, filtered from quiet state summary. |
| **30 – 59** | `NOTABLE` | Moderate movement or single-signal anomaly. | Amber badge, secondary rank. |
| **60 – 79** | `SIGNIFICANT` | Multi-signal divergence or strong volume surge. | Rose badge, prominent card ranking. |
| **80 – 100** | `MAJOR` | Extreme structural divergence or breakout. | Bright Rose badge, top-priority headline. |

---

### 9.3 Structured Factual Reasons & Explanations

The engine deterministically emits structured reason objects (`ChangeReason[]`) containing factual metrics without speculation:

- `PRICE_SURGE` / `PRICE_DROP`: *"Price increased by +4.85% since checkpoint"* (`+4.85%`)
- `BENCHMARK_DIVERGENCE`: *"Outperformed NIFTY 50 by +3.95 percentage points"* (`+3.95% vs benchmark`)
- `VOLUME_SPIKE`: *"Trading volume is 2.8x higher than 20-day baseline"* (`2.8x avg vol`)
- `VOLATILITY_EXPANSION`: *"Intraday price range expanded to 2.5x historical range"* (`2.5x normal range`)
- `DATA_STALE` / `DATA_UNAVAILABLE`: Data trust advisory statements.

---

### 9.4 Ranking & Quiet State Rules

1. **Deterministic Sorting:**
   - Primary: `significanceScore` (descending)
   - Secondary: `|priceDeltaPercent|` (descending)
   - Tertiary: `symbol` (alphabetical ascending, strict tie-breaker)
2. **Quiet State:**
   - If all instruments in a watchlist are classified as `NORMAL` (Score < 30), the engine emits `isQuietState = true` and `meaningfulChangesCount = 0`.
   - The UI honors quiet state by displaying calm reassurance rather than manufacturing false urgency.

---

## 10. LLM Architectural Boundary

```text
┌────────────────────────────────────────────────────────┐
│ TRACE Core Engine (Local, Deterministic, 0ms latency)  │
│  • Mathematical Signal Computation                     │
│  • Significance Scoring (0–100)                        │
│  • Significance Tier Mapping                           │
│  • Deterministic Ranking                               │
│  • Structured Factual Evidence JSON                    │
└───────────────────────────┬────────────────────────────┘
                            │ StructuredChangeEvidence JSON
                            ▼
┌────────────────────────────────────────────────────────┐
│ Optional Downstream Narrative Formatter                │
│  • Deterministic Template Formatter (Default)          │
│  • Optional External LLM (Groq / Gemini)               │
│                                                        │
│  STRICT CONSTRAINT:                                    │
│  The LLM has ZERO authority to calculate metrics,      │
│  alter significance scores, or invent market events.   │
└────────────────────────────────────────────────────────┘
```

