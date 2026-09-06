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
       │  • User Watchlists      │                   │  • Indian Equities     │
       │  • Checkpoints & State  │                   │  • NIFTY 50 Benchmark  │
       │  • Snapshots            │                   │  • Volume & Volatility │
       │  • RLS Access Control   │                   └────────────────────────┘
       └─────────────────────────┘
```

---

## 3. Frontend / Backend Boundaries

1. **Client Components (`app/`, `components/`)**:
   - Focus exclusively on rendering state, user interactions, local UI toggles, and invoking Server Actions.
   - **Never** import database clients, execute raw SQL, or calculate market change scoring.
2. **Server Layer (`server/`)**:
   - Contains all domain logic, service implementations, and data manipulation.
   - Operates in a secure server-side runtime with full access to environment secrets and database credentials.
3. **Database Access Layer (`lib/supabase/`)**:
   - Isolated into browser (`client.ts`), server (`server.ts`), and middleware (`middleware.ts`) instances via `@supabase/ssr`.
   - All queries enforce Supabase Row-Level Security (RLS) policies scoped to the authenticated user (`auth.uid()`).

---

## 4. Proposed Module Boundaries

```text
trace/
├── app/                      # Next.js App Router (Routes, Layouts, Route Handlers)
├── components/               # Presentation Layer
│   ├── ui/                   # Headless primitives (shadcn foundation)
│   └── common/               # Shared presentational widgets
├── lib/                      # Cross-cutting Utilities
│   ├── supabase/             # SSR Supabase client wrappers & session middleware
│   ├── validation/           # Input validation contracts & schemas
│   └── utils.ts              # Styling & class merger utilities
├── server/                   # Server-side Business & Domain Services
│   ├── market/               # Market data abstraction & provider adapters
│   ├── watchlist/            # Watchlist persistence & management logic
│   ├── checkpoint/           # Checkpoint capture, retrieval & deduplication
│   └── change-engine/        # Deterministic change detection & scoring engine
├── types/                    # Shared TypeScript domain contracts
│   ├── market.ts             # Quotes, instruments, snapshots, freshness
│   ├── watchlist.ts          # Watchlists & item relations
│   ├── checkpoint.ts         # Baseline state & checkpoint structures
│   ├── change-engine.ts      # Structured evidence & ranked change items
│   └── database.ts           # Supabase PostgreSQL schema types placeholder
└── supabase/
    └── migrations/           # Versioned SQL migration scripts
```

---

## 5. Data Flow & Checkpoint Memory Concept

### Step-by-Step Data Flow

```text
1. User Session Initialization:
   User logs in / visits -> Server retrieves latest Watchlist + most recent Checkpoint baseline.

2. Market Data Retrieval:
   Market Data Service fetches current quotes for all symbols in the watchlist plus the NIFTY 50 benchmark.

3. Meaningful Change Evaluation:
   Change Engine receives:
     - Baseline Checkpoint State (quotes at timestamp T0)
     - Current Market State (quotes at timestamp T1)
     - Benchmark Index State (NIFTY 50 at T0 and T1)

4. Deterministic Scoring & Structured Evidence Output:
   Change Engine evaluates mathematical signals (price movement, volume ratio, NIFTY divergence)
   and produces structured evidence:
   {
     symbol: "TATAMOTORS",
     price_change: 4.85,
     volume_ratio: 2.80,
     relative_market_performance: 3.95,
     significance_score: 78,
     reasons: [...]
   }

5. Checkpoint Memory & Baseline Update:
   Server records a new checkpoint baseline (or updates last-seen checkpoint according to cadence policy).
   The system retains memory of what was shown to prevent redundant alert fatigue.

6. Presentation:
   UI renders the ranked change feed ("Your TRACE") with data freshness indicators and structured reasons.
   If no changes meet threshold, a quiet valid state is displayed.
```

---

## 6. Change Engine Boundary & Explainability Model

The **Meaningful Change Engine** is decoupled into two distinct layers:

1. **Deterministic Computation (Core, Mandatory):**
   - Pure, explainable mathematical calculations.
   - Evaluates price delta, volume anomaly relative to baseline, divergence against NIFTY 50 benchmark, and volatility shifts.
   - Computes a normalized `significance_score` (0–100) mapped to provisional tiers (`Normal`, `Notable`, `Significant`, `Major`) and structured reasons (`ChangeReason[]`).
2. **Narrative Formatting (Optional Downstream Layer):**
   - Takes the output `StructuredChangeEvidence` and formats it into concise prose (via deterministic templates by default, or an optional external LLM like Groq).
   - **Hard Rule:** The LLM is strictly a formatter/summarizer; it has zero authority to decide if a change happened, calculate metrics, or determine ranking.

---

## 7. Reliability, Data Freshness & UX State Handling

- **Data Trust Taxonomy:** Every market quote and checkpoint delta is classified into one of four states:
  - `FRESH`: Quote timestamp is within current market threshold.
  - `DELAYED`: Upstream exchange feed is standard 15m delayed.
  - `STALE`: Quote timestamp exceeds threshold; amber warning badge rendered.
  - `UNAVAILABLE`: Upstream provider unreachable or instrument halted; fallback to last snapshot.
- **Provider Resilience:** The `IMarketDataService` interface isolates external API specifics, enabling caching, failover, or mock simulation for testing.
- **Quiet State Support:** A return visit with no abnormal movements is handled as a first-class, valid state rather than an error or empty state.

---

## 8. Open Architecture Decisions & Trade-offs

| Decision | Option A | Option B | Selected / Current Posture | Trade-off Analysis |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Architecture** | Modular Monolith (Next.js App Router + Server Actions) | Microservices (Next.js + separate FastAPI service) | **Modular Monolith** | Avoids multi-service deployment complexity and latency while keeping module boundaries strictly isolated. |
| **State Snapshot Storage** | PostgreSQL JSONB column per checkpoint | Normalized relational rows per instrument | **To be finalized in DB design phase** | JSONB offers snapshot immutability and fast single-record fetch; relational allows SQL-level aggregations. |
| **Market Data Refresh** | Window focus + manual refresh | Realtime WebSockets / SSE | **Window focus + on-demand for MVP** | Conserves API quotas and aligns with discrete checkpoint return journey; WebSockets deferred to stretch. |
| **LLM Explanation Provider** | Groq (Llama 3 inference) | Local / Self-hosted model | **Groq (Deferred to stretch)** | Fast, low-latency API without heavy infrastructure overhead; product works 100% without it. |
