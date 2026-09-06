# TRACE — Product Specification

> **Working Tagline:** "Know what changed. Know what matters."  
> **Challenge:** Code, by Groww 2026 Engineering Challenge

---

## 1. Product Thesis

TRACE is a smart market watchlist engineered to help investors and traders understand what **meaningfully changed** in their watchlist since they last checked.

Traditional financial platforms bombard users with flashing price tickers, endless intraday noise, and raw data tables. TRACE shifts the paradigm from continuous ticker watching to **delta-driven intelligence**:

> **"What changed while I was away?"**

TRACE is **not** primarily a stock price tracker. Its primary value is isolating signal from noise over discrete intervals of time.

---

## 2. The User Problem

1. **Information Overload & Ticker Fatigue:** Users monitor dozens of instruments across equities, indices, and sectors. Scanning raw percentage changes fails to convey which movements are unusual, benchmark-divergent, or structurally significant.
2. **Context Loss Between Visits:** When a user opens their watchlist after several hours or days, standard apps only show the change relative to the previous day's market close. They cannot answer: *"What happened between my last visit at 11:30 AM and now at 3:00 PM?"*
3. **Black-box "AI" Dashboards:** Modern tools often slap non-deterministic LLM summaries over hallucinated or untraceable market claims, degrading trust.
4. **Lack of Explainability:** A 3% jump in a high-beta stock might be normal intraday noise, whereas a 1.5% drop on 4x average volume in a defensive utility during a market-wide rally is a major divergence. Generic watchlists treat both identically.

---

## 3. Core Experience

The core user journey follows a clean checkpoint loop:

```text
User checks their watchlist
        ↓
TRACE records a checkpoint (state snapshot)
        ↓
Market conditions evolve while user is away
        ↓
User returns to TRACE
        ↓
TRACE compares current market state against previous checkpoint
        ↓
TRACE identifies meaningful changes (deterministic signals)
        ↓
TRACE ranks those changes by significance
        ↓
TRACE explains why each change matters (structured evidence + optional natural language)
```

---

## 4. Core Product Principles

1. **Information over decoration:** High data signal, zero visual clutter.
2. **Premium, restrained fintech aesthetic:** Analytical, calm, modern, and trustworthy.
3. **No generic AI-dashboard visual language:** No neon purple gradients, no floating glassmorphism blobs, no giant cards with empty space.
4. **No fake AI functionality:** Every claim, ranking, and delta is derived from deterministic math and verifiable market facts.
5. **Deterministic core intelligence:** The change detection engine operates strictly on verified data.
6. **Optional LLM explanation boundary:** An LLM may later be used to translate structured facts into natural language summaries, but the LLM must *never* determine if a market change occurred or compute market facts.
7. **First-class data freshness & reliability:** Staleness, market closure states, and data latency must be explicitly transparent to the user.
8. **Simplicity over premature complexity:** A clean modular monolith is preferred over fragmented microservices.

---

## 5. MVP Scope

The initial Minimum Viable Product includes:

- **Authentication:** Secure user sign-up, login, and session persistence via Supabase Auth.
- **Watchlist Management:**
  - Create and manage a primary watchlist.
  - Add and remove market instruments.
  - Reorder / organize instruments.
- **Market Data Baseline:**
  - View latest market data for instruments in the watchlist.
  - Transparent data freshness and timestamp indicators.
- **State Persistence & Snapshots:**
  - Persist user watchlists in Supabase PostgreSQL.
  - Record snapshots of market state.
- **Checkpoint System:**
  - Automatically or deliberately capture checkpoint baselines on user visits.
  - Retrieve and inspect the baseline from the user's prior session.
- **Deterministic Meaningful Change Engine (v1):**
  - Compute deltas between current market state and previous checkpoint.
  - Detect abnormal price movement, volume anomalies, and benchmark divergence.
  - Score and rank changes by significance.
- **Change Feed UI:**
  - Render an ordered, scannable feed of what changed since the last visit.
  - Display structured reasons (e.g. "Price +3.2% on 2.4x volume vs NIFTY -0.4%").
- **Instrument Detail View:**
  - Drill down into specific instrument metrics and checkpoint delta history.
- **Robust UI States:**
  - First-class loading, empty, error, stale, and delayed data states.
  - Fully responsive web layout.

---

## 6. Future & Stretch Scope (Post-MVP)

- **Relative Market Performance Benchmarks:** Multi-index sector-relative divergence models.
- **Volume & Volatility Anomaly Modeling:** Dynamic rolling standard deviation / historical percentile bands.
- **Event & Earnings Markers:** Corporate action, earnings date, and news correlation.
- **Checkpoint Time Travel / Change History:** Compare across arbitrary historical checkpoints (e.g. "Yesterday morning", "Last Friday close").
- **Custom Sensitivity Profiles:** User-configurable thresholds for alert significance (conservative vs aggressive).
- **Multiple Watchlists & Tagging:** Support for categorized portfolios and themes.
- **Realtime Push Updates:** WebSocket/Supabase Realtime updates when high-conviction events trigger.
- **Optional LLM Explanations:** External provider integration (e.g. Groq / Llama 3) strictly taking structured evidence JSON as input.

---

## 7. Open Product Decisions

| Decision Area | Description | Current Status |
| :--- | :--- | :--- |
| **Default Checkpoint Policy** | Should checkpoints be recorded automatically on session close, automatically on session open, or on explicit user action? | Open. Architectural hooks will support both automatic visit-based and explicit manual checkpoints. |
| **Market Coverage & Asset Classes** | Will Phase 2 target Indian equities (NSE/BSE) exclusively, US equities (NASDAQ/NYSE), or multi-asset? | Open. Type definitions support multi-asset structures with currency and exchange attributes. |
| **Default Market Benchmark** | What reference index (e.g., NIFTY 50, S&P 500) will be used for computing relative market performance? | Open. Abstraction allows configurable benchmark symbol per exchange/asset class. |
| **Significance Scoring Weights** | The exact weight distribution between price delta, volume ratio, and index divergence. | Open. Change Engine boundary isolates the algorithm to enable parameter tuning without refactoring. |
