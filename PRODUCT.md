# TRACE — Product Specification

> **Working Tagline:** "Know what changed. Know what matters."  
> **Challenge:** Code, by Groww 2026 Engineering Challenge  
> **Status:** Authoritative Product Specification (Phase 2)

---

## 1. Product Identity & Thesis

### 1.1 Product Identity
- **Product Name:** TRACE
- **Tagline:** "Know what changed. Know what matters."
- **Domain:** Fintech / Market Intelligence / Intelligent Watchlist

### 1.2 Core Product Thesis
TRACE is a smart market watchlist that helps investors and traders understand what **meaningfully changed** in their watchlist since they last checked.

TRACE is **NOT** primarily a stock price tracker. Its primary product value is answering:

> **"What changed while I was away?"**

Traditional financial applications bombard users with flashing price tickers, intraday noise, and dense data tables. TRACE fundamentally shifts the paradigm from continuous ticker watching to **delta-driven intelligence**, dramatically reducing the cognitive burden of manual scanning when a retail investor returns to their watchlist.

---

## 2. Target User & Typical Journey

### 2.1 Primary User
A retail investor or swing trader who follows a curated list of stocks and does **not** want to manually inspect every stock chart and quote every time they check the market.

### 2.2 Typical User Journey

```text
Morning (09:15 AM):
User checks their watchlist before starting their workday.
TRACE establishes a baseline Checkpoint.

[ User leaves to focus on their day. Market conditions evolve. ]

Afternoon (02:30 PM):
User returns to TRACE.
Instead of forcing the user to scan 20+ stock rows and calculate mental deltas,
TRACE immediately answers: "What changed since you last checked at 09:15 AM?"

Outcome:
User reviews the top 3 meaningful changes (with structured evidence),
investigates if desired, and establishes a fresh baseline.
```

---

## 3. Product Differentiation

| Dimension | Traditional Watchlists | TRACE |
| :--- | :--- | :--- |
| **Primary Question** | *"What is happening right now?"* | *"What changed since I last looked, and what deserves my attention?"* |
| **Mental Model** | Ephemeral, real-time ticker stream | **Memory layer** over the user's watchlist |
| **Information Density** | Unfiltered raw metrics for all symbols | Prioritized, contextual signal feed ranked by significance |
| **Baseline Reference** | Previous day's market close | User's **actual last-seen checkpoint** |
| **Context** | Single-symbol percentage move | Multi-factor (behavioral range, volume anomaly, benchmark divergence) |
| **Cognitive Load** | High (manual scanning required) | Low (isolated signal and explainable reasons) |

---

## 4. Product Principles

1. **Signal over noise:** Prioritize what matters; eliminate ornamental distractions.
2. **Context over raw numbers:** A 3% move means nothing without historical volatility, volume, and benchmark context.
3. **Evidence over speculation:** Every highlighted change must be anchored to verifiable, observable market facts.
4. **Memory over repetition:** Track what the user has already seen; never re-flag stale information as novel.
5. **Reliability over novelty:** Predictable, rock-solid data integrity is vastly superior to flashy, unstable features.
6. **Simplicity over feature count:** Do one thing exceptionally well before expanding scope.
7. **Deterministic intelligence over opaque AI:** Core change detection must be 100% mathematical and explainable.
8. **Clear uncertainty when data is uncertain:** Transparently communicate stale, delayed, or degraded states.
9. **Fully functional without AI:** The product must deliver complete value using deterministic structured explanations alone.
10. **Explainable decisions:** Every rank, flag, and score must have a clear "Why we're flagging this" rationale.

---

## 5. Core User Loop & Checkpoint Concept

### 5.1 The Core User Loop

```text
FIRST VISIT / ONBOARDING
          ↓
Create Account & Authenticate
          ↓
Build Watchlist (Add Indian Equities)
          ↓
View Market Information
          ↓
TRACE records initial Checkpoint
          ↓
[ User leaves — Market moves ]
          ↓
User returns to TRACE
          ↓
TRACE compares Current Market State with Previous Checkpoint
          ↓
TRACE identifies Meaningful Changes (Multi-signal evaluation)
          ↓
TRACE ranks changes by Significance Score
          ↓
TRACE presents Supporting Evidence & Structured Reasons
          ↓
User investigates specific instrument details (if desired)
          ↓
New Checkpoint is established (updating memory baseline)
```

### 5.2 Checkpoint Semantics & Memory Layer

A **Checkpoint** represents the user's meaningful market-view state at a discrete point in time.

$$\text{Current Market State} - \text{Previous Checkpoint State} = \text{What Changed}$$

**Key Memory Semantics:**
- **Seen State Awareness:** The system records what baseline the user was presented with, ensuring returning users are not shown repeated alerts for movements that occurred before their last acknowledged visit.
- **Cadence Flexibility:** Checkpoints capture both automatic session baselines and deliberate user-triggered checkpoints.
- **Persistence:** Checkpoints are durably stored per user and per watchlist in Supabase PostgreSQL.

---

## 6. Primary Product Experience & Killer Feature ("Your TRACE")

### 6.1 Overview Experience ("What Did I Miss?")
When a user opens TRACE, the primary screen is dominated not by a raw stock table, but by **"Your TRACE"**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ TRACE                                              [ 14:30 IST ]       │
│ Good afternoon, Sathvika.                                              │
│                                                                        │
│ SINCE YOUR LAST CHECK (10:15 AM IST)                                   │
│ 5 meaningful changes detected across your watchlist                    │
│   • 2 Positive Divergences  • 2 Negative Divergences  • 1 Volume Spike │
├────────────────────────────────────────────────────────────────────────┤
│ SIGNIFICANT                                                            │
│                                                                        │
│ TATAMOTORS                          ₹1,042.50 (+4.85%)                 │
│ Unusual Movement & Volume           Since 10:15 AM                     │
│                                                                        │
│ • Movement is ~3.2× its typical intraday range                         │
│ • Volume is 2.8× baseline average                                      │
│ • Outperformed NIFTY 50 by +3.95 percentage points                     │
│                                                                        │
│ [ View Details → ]                                                     │
├────────────────────────────────────────────────────────────────────────┤
│ NOTABLE                                                                │
│                                                                        │
│ INFY                                ₹1,820.00 (-2.10%)                 │
│ Benchmark Divergence                Since 10:15 AM                     │
│                                                                        │
│ • Dropped -2.10% while NIFTY 50 gained +0.45%                          │
│ • Relative divergence of -2.55 percentage points                       │
│                                                                        │
│ [ View Details → ]                                                     │
├────────────────────────────────────────────────────────────────────────┤
│ WATCHLIST SUMMARY (Secondary)                                          │
│ 12 Instruments Monitored • All Data Fresh                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Meaningful Change Engine & Evidence Model

### 7.1 Multi-Signal Evaluation
TRACE rejects single arbitrary percentage thresholds (e.g. *"flag anything > 3%"*). Movements are evaluated contextually across multiple signals:

1. **Absolute Price Movement:** Magnitude and direction of price delta since checkpoint ($\Delta P$).
2. **Movement Relative to Normal Behavior:** Price movement normalized against the instrument's historical volatility or typical range (e.g., Average True Range or standard deviation).
3. **Volume Anomaly:** Trading volume ratio relative to typical baseline volume for that time window ($V_{\text{current}} / V_{\text{baseline}}$).
4. **Relative Market Performance:** Divergence relative to benchmark index (e.g., Stock Delta $\%$ $-$ NIFTY 50 Delta $\%$).
5. **Volatility Shift:** Intraday price swing expansion relative to historical baseline.
6. **Important Events:** Corporate actions, earnings dates, or board meetings (when data is available).
7. **Time Elapsed:** Time interval since the previous checkpoint.

### 7.2 Significance Scoring Tiers (Provisional)

The Change Engine produces an explainable, normalized **Significance Score** (0–100):

| Score Band | Tier Label | Product Behavior |
| :--- | :--- | :--- |
| **0 – 29** | **Normal** | Filtered out of primary change feed; visible in standard watchlist table. |
| **30 – 59** | **Notable** | Displayed in change feed under secondary attention. |
| **60 – 79** | **Significant** | Highlighted with prominent card and structured reasons. |
| **80 – 100** | **Major** | Top priority banner with multi-factor evidence callouts. |

> *Note: These scoring bands are provisional architectural targets and will be rigorously tested, calibrated, and tuned against historical market data.*

### 7.3 Structured Facts Contract
The engine outputs structured, verifiable evidence:

```json
{
  "symbol": "TATAMOTORS",
  "price_change": 4.85,
  "volume_ratio": 2.8,
  "relative_market_performance": 3.95,
  "significance_score": 78,
  "reasons": [
    {
      "code": "VOLATILITY_EXPANSION",
      "description": "Movement is ~3.2× its typical intraday range",
      "magnitude": 3.2
    },
    {
      "code": "VOLUME_SPIKE",
      "description": "Trading volume is 2.8× baseline average",
      "magnitude": 2.8
    },
    {
      "code": "BENCHMARK_OUTPERFORMANCE",
      "description": "Outperformed NIFTY 50 by +3.95 percentage points",
      "magnitude": 3.95
    }
  ]
}
```

---

## 8. Explainability Framework

### 8.1 The Fact / Interpretation / Speculation Boundary

TRACE adheres to a strict epistemological boundary:

| Category | Definition | TRACE Policy |
| :--- | :--- | :--- |
| **FACT** | Directly observed, verified data (price, volume, benchmark level, timestamp). | **Always surfaced.** Ground truth. |
| **INTERPRETATION** | Deterministic mathematical derivation (e.g. 2.8× average volume, +3.95% relative to NIFTY). | **Core value.** Clearly structured and explainable. |
| **SPECULATION** | Unverified causal claims (e.g. *"Stock rose because of rumors regarding a new contract"*). | **Strictly prohibited.** TRACE never invents or guesses causal drivers without hard verified event data. |

---

## 9. LLM Policy & Architecture

### 9.1 The Strict Separation of Concerns
1. **Core Intelligence is 100% Deterministic:** Mathematical scoring, change detection, and ranking are computed solely by the Deterministic Change Engine.
2. **LLM is Strictly Downstream (Optional Layer):** An LLM (e.g. Groq / Llama 3) may later ingest the `StructuredChangeEvidence` JSON to produce natural language narratives.
3. **LLM Constraints:**
   - The LLM must **NEVER** determine whether a market event occurred.
   - The LLM must **NEVER** calculate price deltas, volume ratios, or significance scores.
   - The LLM is **NOT** a data source.
   - The LLM is **NOT** required for TRACE to function. If offline or disabled, TRACE renders deterministic template-based explanations seamlessly.

```text
┌────────────────────────┐
│ Verified Market Data   │
└───────────┬────────────┘
            ▼
┌──────────────────────────────────────────────┐
│ Deterministic Change Engine                  │
│ (Pure Math, Relative Divergence, Scoring)    │
└───────────┬──────────────────────────────────┘
            ▼
┌──────────────────────────────────────────────┐
│ Structured Facts (JSON Evidence Contract)    │
└───────────┬──────────────────────────────────┘
            │
            ├─────────────────────────────────────────────┐
            ▼ (Default / Always Available)                ▼ (Optional Future Layer)
┌────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│ Deterministic Template Explanations    │   │ Optional External LLM Narrative        │
│ (e.g., "Volume 2.8x, +3.95% vs NIFTY") │   │ (e.g., Groq / Llama 3 Natural Prose)   │
└────────────────────────────────────────┘   └────────────────────────────────────────┘
```

---

## 10. Market Scope & Benchmark Reference

### 10.1 Initial Market Scope
- **Target Market:** Indian Equities (NSE / BSE).
- **Target Audience:** Indian retail investors and positional traders.
- **Default Reference Benchmark:** **NIFTY 50** (with future extensibility for BSE SENSEX and sectoral indices like NIFTY BANK, NIFTY IT).

### 10.2 Relative Benchmark Calculation
$$\text{Relative Performance} = \Delta \text{Stock}\% - \Delta \text{NIFTY 50}\%$$

*Example:*
- Reliance Industries: $+4.80\%$
- NIFTY 50: $+0.90\%$
- **Relative Divergence:** $+3.90\text{ percentage points}$ (Stock-specific strength isolated from market tailwind).

### 10.3 Extensibility
The architecture abstracts market symbols and benchmark providers, allowing seamless addition of US equities (S&P 500 / NASDAQ) or digital assets in future releases.

---

## 11. Phased Product Scope

### 11.1 Minimum Viable Product (MVP)

#### Account & Authentication
- User sign-up, login, logout, and session persistence via Supabase Auth.

#### Watchlist Management
- Create, rename, and manage a primary watchlist.
- Search and add Indian equity instruments.
- Remove instruments from watchlist.
- Durable persistence in Supabase PostgreSQL.

#### Market Data & Trust
- Latest quote retrieval (Price, Change, Change %, Volume, Day High/Low, Previous Close).
- Baseline market quote timestamps and data freshness indicators (Fresh, Delayed, Stale, Unavailable).

#### TRACE Intelligence (Core Engine)
- Checkpoint baseline creation and automatic comparison.
- Price delta calculation since checkpoint.
- Volume anomaly ratio calculation.
- Relative performance against NIFTY 50.
- Deterministic significance scoring and tier classification.
- Structured reasons generation (`ChangeReason[]`).

#### User Experience & UI States
- **TRACE Overview Dashboard:** "Since your last check" hero summary and ranked change feed.
- **Watchlist View:** Compact, scannable table with freshness and significance badges.
- **Instrument Detail View:** Quote metrics, checkpoint comparison breakdown, and structured evidence.
- **Complete UX State Coverage:** All 14 core product states handled gracefully.
- **Responsive Web UI:** Flawless layout on desktop, tablet, and mobile browsers.

---

### 11.2 V1 / Should-Have Scope (Post-MVP)
- **Change History:** Historical timeline of previous checkpoints and past meaningful changes.
- **Advanced Filtering & Sorting:** Filter change feed by significance tier, gainers/losers, or volume spikes.
- **Sectoral Benchmark Comparisons:** Compare against specific sector indices (e.g. NIFTY IT, NIFTY AUTO).
- **Multiple Watchlists:** Support for categorized portfolios (e.g., "Long Term", "High Beta", "Dividends").
- **Custom Sensitivity Profiles:** User-configurable significance thresholds (Conservative / Balanced / Aggressive).
- **Event Markers:** Corporate announcements, earnings calendar tags, and dividend ex-dates.

---

### 11.3 Stretch Scope (Future & Exploratory)
- **Optional LLM Narrative Explanations:** External LLM integration via Groq strictly taking structured evidence JSON.
- **Realtime Push Alerts:** WebSockets / Web Push notifications when high-conviction events cross critical thresholds.
- **Cross-Market Intelligence:** US Equities (S&P 500), Global FX, and Commodities.
- **Portfolio-Weighted Anomaly Detection:** Weighting significance by user's position size.

---

## 12. Explicit Non-Goals (What TRACE is NOT)

1. **NOT a Trading Platform / Brokerage:** TRACE does not execute orders, place trades, or hold funds.
2. **NOT a Financial Advisory Service:** TRACE does not provide personalized investment advice or asset allocation recommendations.
3. **NOT a Price Prediction Engine:** TRACE strictly observes past and current state; it makes **zero claims** about future price direction.
4. **NOT a Buy/Sell Recommendation System:** TRACE highlights *what changed*; it never tells a user to *buy*, *sell*, or *hold*.
5. **NOT an AI Chatbot:** TRACE is an analytical dashboard, not a conversational stock-picking bot.
6. **NOT a Bloomberg Terminal Replacement:** TRACE focuses on focused, minimalist clarity over thousands of obscure data fields.

---

## 13. Comprehensive UX States Specification

TRACE specifies explicit product behaviors for all **14 key operational states**:

| # | State | Condition | Product Behavior & UI Communication |
| :--- | :--- | :--- | :--- |
| **1** | **First-Time User** | User has created an account but has no instruments or checkpoints. | Welcoming, minimalist onboarding guide prompting the user to add their first 3–5 stocks to initiate their baseline. |
| **2** | **Returning User (With Changes)** | User returns and $\ge 1$ instrument meets Notable/Significant/Major threshold. | "Since your last check [Time]" summary with count of positive/negative changes and ranked feed of structured evidence cards. |
| **3** | **Returning User (Quiet / No Changes)** | User returns, but all watchlist movements remain within normal ranges (0–29 score). | **Valid product state (NOT an error):** Reassuring, calm banner: *"Nothing significant changed since your last check (10:15 AM). Your watchlist is moving normally."* |
| **4** | **Market Open** | Current time is within trading hours (09:15–15:30 IST). | Live status indicator: `Market Open (IST)` with active checkpoint comparison indicators. |
| **5** | **Market Closed / Weekend** | Outside exchange trading hours. | Clear indicator: `Market Closed`. Baseline compares against market close snapshot with countdown to next session. |
| **6** | **Delayed Data** | Data provider supplies exchange quotes with standard 15-minute delay. | Explicit badge: `Delayed (~15m)`. All timestamps clearly labeled to prevent false assumptions of real-time execution. |
| **7** | **Stale Data** | Quote timestamp exceeds refresh threshold or provider connection drops. | Amber badge: `Data Stale (Updated 24m ago)`. Prevents user from acting on outdated numbers. |
| **8** | **Provider Failure** | Market data API unreachable or rate-limited. | Non-blocking warning banner: *"Market data temporarily unavailable. Displaying last saved snapshot from 11:30 AM."* |
| **9** | **Empty Watchlist** | User deleted all items from active watchlist. | Friendly empty card with quick-add search bar and popular benchmark suggestions. |
| **10** | **Failed Watchlist Operation** | Adding or removing an instrument fails (network/DB error). | Inline toast error with immediate retry option; non-destructive to existing state. |
| **11** | **Partial Data Availability** | Quotes retrieved for 8 of 10 stocks; 2 fail upstream. | 8 stocks displayed with full analysis; 2 marked with `Quote Unavailable` without crashing the page. |
| **12** | **Instrument Unavailable / Delisted** | Symbol suspended, halted, or delisted by exchange. | Muted badge: `Trading Halted / Delisted` with explanation on detail page. |
| **13** | **No Previous Checkpoint** | User created a watchlist but this is their initial session. | Initializing banner: *"Initial baseline captured just now. Changes will appear when you return later or as market moves."* |
| **14** | **Very Large Watchlist** | User monitors 50+ instruments. | High-performance virtualized feed; changes grouped by significance tier with quick jump filters. |

---

## 14. Data Trust & Freshness Hierarchy

Data trust is a first-class product pillar. Every quote, delta, and evidence card displays a verifiable freshness classification:

```text
┌──────────────┐     Quote age < threshold     ┌────────────────────────────────────┐
│ Market Quote ├──────────────────────────────►│ FRESH (Green dot / Live)           │
└──────┬───────┘                               └────────────────────────────────────┘
       │
       │             Provider delayed feed     ┌────────────────────────────────────┐
       ├──────────────────────────────────────►│ DELAYED (Neutral badge / ~15m)     │
       │                                       └────────────────────────────────────┘
       │
       │             Quote age > threshold     ┌────────────────────────────────────┐
       ├──────────────────────────────────────►│ STALE (Amber badge / Stale warning)│
       │                                       └────────────────────────────────────┘
       │
       │             Provider error / halted   ┌────────────────────────────────────┐
       └──────────────────────────────────────►│ UNAVAILABLE (Muted / Degraded msg) │
                                               └────────────────────────────────────┘
```

---

## 15. Primary Screen Architecture

```text
1. TRACE Overview (/dashboard)
   ├── Header & Market Status (IST Clock, Freshness Indicator)
   ├── "Your TRACE" Summary Banner (Since last check time, Change counts)
   ├── Meaningful Change Feed (Ranked cards with structured evidence)
   └── Watchlist Summary Snapshot (Compact secondary overview)

2. Watchlist (/watchlist)
   ├── Instrument Search & Quick Add
   ├── Full Watchlist Table (Symbol, Price, Checkpoint Delta, Volume, Significance Badge)
   └── Batch Actions (Reorder, Remove)

3. Instrument Detail (/instrument/[symbol])
   ├── Header & Key Metrics (LTP, Day Range, 52W High/Low, Volume)
   ├── Checkpoint Delta Deep-Dive (Price delta, Volume ratio, NIFTY divergence)
   ├── Structured Reasons Breakdown (Full mathematical evidence list)
   └── Historical Price Context Chart

4. Change History (/history)
   ├── Chronological Checkpoint Timeline
   └── Historical Meaningful Changes Archive

5. Watchlist Management & Settings (/settings)
   ├── Watchlist configuration
   ├── Account & Session Management
   └── Significance sensitivity preferences (V1)
```

---

## 16. Product-Level Acceptance Criteria (MVP)

1. **Watchlist Persistence:** A user can create, add symbols to, and remove symbols from a watchlist; state persists reliably across browser refreshes and subsequent logins.
2. **Checkpoint Memory:** When a returning user opens TRACE, the application computes deltas strictly against their last recorded checkpoint baseline rather than solely against daily market close.
3. **Structured Evidence Traceability:** Every change flagged as Notable, Significant, or Major can be expanded to reveal exact mathematical evidence (price delta, volume ratio, NIFTY 50 divergence).
4. **Noise Filtering:** Normal intraday price fluctuations within expected volatility bands must **not** trigger high-significance alerts.
5. **Quiet State Validity:** When no instrument in the watchlist exhibits unusual divergence, the system displays a clear, calm confirmation that nothing significant changed (and does not display an error or empty state).
6. **Data Freshness Transparency:** The UI explicitly categorizes and displays the freshness status (Fresh, Delayed, Stale, Unavailable) for all displayed market quotes.
7. **Graceful Degradation:** Upstream market data provider errors or partial failures must never crash the UI or present stale data as fresh.
8. **LLM Independence:** The entire core user experience—including change detection, ranking, and structured explanations—functions 100% deterministically without requiring an LLM connection.
9. **Authentication & RLS Security:** Users can only view and modify their own watchlists and checkpoints (enforced via Supabase Row-Level Security).
10. **Responsive Execution:** All screens adapt cleanly across desktop, tablet, and mobile viewports with zero layout breakage.

---

## 17. Open Product Questions (For Phase 3 & Beyond)

| # | Question Area | Description | Current Architectural Posture |
| :--- | :--- | :--- | :--- |
| **1** | **Change Scoring Formula** | What is the exact mathematical weighting between price delta, volume ratio, and benchmark divergence? | Isolated inside `server/change-engine/engine.ts`; tunable without altering UI or data persistence contracts. |
| **2** | **Historical Lookback Window** | What historical window (e.g. 20-day rolling ATR / 30-day average volume) should define "normal behavior"? | Abstracted behind `IMarketDataService` interface. |
| **3** | **Market Data Provider Selection** | Which specific provider (e.g., Yahoo Finance, Alpha Vantage, Kite Connect, Upstox API) will supply Indian market quotes? | Abstracted behind `IMarketDataService` adapter pattern. |
| **4** | **Refresh & Polling Strategy** | Should quotes refresh on window focus, polling interval (e.g. 60s), or manual refresh button? | Window focus + manual refresh targeted for MVP to conserve API limits. |
| **5** | **Checkpoint Trigger Semantics** | When should a new checkpoint be created? Automatically on visit conclusion, on user acknowledgment, or after fixed dwell time? | Supported via `ICheckpointService` with metadata trigger tags. |
| **6** | **Multiple Watchlists in MVP** | Should MVP support multiple watchlists or strictly a single default watchlist? | Single default watchlist for MVP; database schema designed with `watchlist_id` foreign keys for seamless V1 multi-watchlist expansion. |
| **7** | **Corporate Event Scope** | Which corporate events (earnings, dividends, splits) should be included in MVP vs V1? | Deferred to V1; MVP focuses on price, volume, and benchmark divergence. |
| **8** | **Significance Score Thresholds** | Will the provisional bands (30/60/80) be calibrated per asset class or universally? | Universal provisional bands for MVP; calibrated post-launch. |
| **9** | **Data Staleness Thresholds** | After how many minutes should equity data be marked `Stale` during market hours? | Configurable parameter (provisional default: 15 minutes). |
