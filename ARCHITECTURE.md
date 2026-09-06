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

## 8. Change Engine & Explainability Boundary

1. **Deterministic Computation (Core, Mandatory):**
   - Pure, explainable mathematical calculations comparing `checkpoint_snapshots` baseline against current market quotes.
   - Evaluates price delta, volume anomaly relative to baseline, divergence against NIFTY 50 benchmark, and volatility shifts.
   - Computes normalized `significance_score` (0–100) mapped to provisional tiers (`Normal`, `Notable`, `Significant`, `Major`) and structured reasons (`ChangeReason[]`).
2. **Narrative Formatting (Optional Downstream Layer):**
   - Ingests structured evidence JSON to format concise prose (via templates by default, or an optional external LLM like Groq).
   - **Hard Rule:** The LLM is strictly a formatter/summarizer; it has zero authority to decide if a change happened, calculate metrics, or determine ranking.
