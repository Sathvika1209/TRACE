# TRACE

> **"Know what changed. Know what matters."**  
> *Engineered for the Code, by Groww 2026 Engineering Challenge.*

---

## Overview

**TRACE** is a smart market watchlist designed to help investors and traders immediately understand what meaningfully changed in their watchlist since they last checked.

Rather than acting as a standard intraday price ticker, TRACE captures discrete user checkpoints, computes deterministic change signals (price movement, volume anomalies, benchmark divergence), and ranks those changes with structured explainability.

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Primitives:** [shadcn/ui](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, `@supabase/ssr`)
- **Deployment Target:** [Vercel](https://vercel.com/)

---

## Project Structure

```text
trace/
├── app/                      # Next.js App Router (Layouts, Pages, Middleware)
├── components/               # Presentation Layer
│   ├── ui/                   # Headless component primitives (shadcn)
│   └── common/               # Shared presentational components
├── lib/                      # Utilities & Infrastructure Wrappers
│   ├── supabase/             # Official Supabase SSR client & middleware
│   ├── validation/           # Domain input validation helpers
│   └── utils.ts              # Styling / class merger utility
├── server/                   # Server Domain Services & Business Boundaries
│   ├── market/               # Market data abstraction & provider contracts
│   ├── watchlist/            # Watchlist service boundary
│   ├── checkpoint/           # Checkpoint capture & baseline management
│   └── change-engine/        # Meaningful change detection & scoring engine
├── types/                    # Shared TypeScript domain contracts & types
│   ├── market.ts             # Quotes, instruments, snapshots, freshness
│   ├── watchlist.ts          # Watchlist domain structures
│   ├── checkpoint.ts         # User baseline & checkpoint definitions
│   ├── change-engine.ts      # Structured evidence & ranked change contracts
│   └── database.ts           # Supabase database types placeholder
├── supabase/
│   └── migrations/           # Database migration scripts
├── tests/                    # Test suites
├── PRODUCT.md                # Product thesis, principles, and scope
├── ARCHITECTURE.md           # High-level architecture, module boundaries & data flow
├── DESIGN.md                 # Design system philosophy, typography & states
├── .env.example              # Environment variables template
└── package.json
```

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) (v10+)
- A [Supabase](https://supabase.com/) account / project (for later phases)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd trace
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your keys:

```bash
cp .env.example .env.local
```

Populate the required Supabase environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

---

## Available Scripts

- `npm run dev` — Start Next.js development server
- `npm run build` — Create production build
- `npm run start` — Run production server
- `npm run lint` — Execute ESLint static analysis
- `npm run typecheck` — Run TypeScript type checking without emitting files
- `npm test` — Run Node.js test runner for persistence and deterministic change engine suites

---

---

## Challenge Submission Material (Code, by Groww 2026)

### A. One-Sentence Description
**TRACE** is a deterministic smart market watchlist that answers *"What changed while I was away?"* by comparing live market telemetry against discrete user checkpoints across price, volume, benchmark divergence, and volatility.

### B. 100-Word Pitch
Investors waste valuable focus repeatedly rescanning unchanged watchlists without knowing what actually moved. TRACE introduces an explicit memory baseline: each time you check your watchlist, a discrete checkpoint is recorded. When you return, TRACE deterministically evaluates current market telemetry against that checkpoint—computing price deltas, 20-day volume ratios, NIFTY 50 relative alpha, and volatility expansions. Rather than spewing probabilistic AI hallucinations, TRACE surfaces ranked, evidence-backed changes categorized into four canonical tiers: Normal, Notable, Significant, and Major. If nothing meaningfully shifted, TRACE delivers an immediate Quiet State reassurance, empowering investors to acknowledge changes and advance their baseline with absolute trust.

### C. Key Engineering Decisions
1. **Zero-LLM Deterministic Intelligence:** Core change detection and scoring (0–100) are purely mathematical and explainable, ensuring zero hallucinations, bit-level test reproducibility, and sub-millisecond evaluation latency.
2. **Explicit Memory Model (Refresh vs Checkpoint):** `[Refresh]` updates live quotes against the *existing* baseline without mutating state; `[Checkpoint]` advances the user's baseline atomically via PostgreSQL stored procedures.
3. **Graceful Error Isolation & Non-Fabrication:** Missing or halted quotes remain strictly `NULL` (never silently converted to `0.00`). Partial batch failures isolate at the instrument level without failing the watchlist.
4. **Dark-First Design System:** Deep Rose / Ink visual hierarchy designed to avoid sensationalist colors, presenting quiet states as positive reassurance rather than empty screens.
5. **Row-Level Security Architecture:** Strict PostgreSQL RLS ownership paths (`auth.users` → `profiles` → `watchlists` → `watchlist_instruments` → `checkpoints` → `checkpoint_snapshots`).

### D. Why TRACE is Different
| Standard Market Watchlist | TRACE Smart Watchlist |
| :--- | :--- |
| Shows raw intraday % change from previous close | Compares against **when YOU last checked** (User Checkpoint) |
| Flashes colors and noise on routine 0.2% ticks | Filters noise and surfaces a **Quiet State** when nothing is notable |
| Evaluates symbols in isolation | Measures **Benchmark Alpha vs NIFTY 50** and volume anomaly ratios |
| Black-box or noisy AI text generation | **Deterministic, explainable evidence** with exact mathematical reasons |

### E. Canonical Significance Tiers
- **0–29 (NORMAL):** Routine market fluctuation within expected historical variance.
- **30–59 (NOTABLE):** Noticeable price movement or minor benchmark divergence.
- **60–79 (SIGNIFICANT):** Major price swing, 2x+ volume expansion, or strong benchmark decoupling.
- **80–100 (MAJOR):** Extreme outlier move combining multi-sigma price action, volume breakout, and market divergence.

### F. Known Limitations
- **Indian Equities Scope (MVP):** Supports NSE/BSE equities and NIFTY 50 benchmark; derivatives and global indices are not currently ingested.
- **Market Delay:** Default free Yahoo Finance feed operates with a ~15-minute delay for Indian equities during live market hours.
- **Single Benchmark:** Relative performance is currently benchmarked exclusively against NIFTY 50 (`^NSEI`).

---

## Application Routes & User Experience

| Route | View | Description |
| :--- | :--- | :--- |
| `/` | **Overview (Primary)** | Answers *"What changed while I was away?"* Displays ranked `ChangeInsight` feed, `QuietState` reassurance, and baseline `[Refresh]` vs `[Checkpoint]` actions. |
| `/watchlist` | **Watchlist Management** | Interactive Indian equity tracker with instant symbol search, exchange selector (NSE/BSE), duplicate guards, and removal controls. |
| `/watchlist/[symbol]` | **Instrument Detail** | Deep analytical breakdown featuring 20-day SVG trajectory charts, baseline reference markers, NIFTY 50 divergence, volume/volatility ratios, and factual reasons. |
| `/history` | **Checkpoint Ledger** | Chronological audit trail of all saved user memory baselines and granular snapshot data. |
| `/settings` | **Settings & Session** | User session information, RLS verification, active market data feed parameters, and sign-out. |
| `/login` | **Authentication** | Restrained Deep Rose / Ink authentication portal with sign-in and account creation tabs. |
| `/design-system` | **Design Showcase** | Interactive living catalog of design tokens, typography, primitives, and domain components (Internal/Preview). |

---

## Documentation & Architecture

- [PRODUCT.md](file:///c:/Users/Sathvika/Documents/antigravity/modest-hertz/PRODUCT.md) — Product thesis, 10 design principles, target user, 14 UX states, and acceptance criteria.
- [ARCHITECTURE.md](file:///c:/Users/Sathvika/Documents/antigravity/modest-hertz/ARCHITECTURE.md) — Modular monolith architecture, PostgreSQL RLS schema, market provider abstraction, and deterministic scoring models.
- [DESIGN.md](file:///c:/Users/Sathvika/Documents/antigravity/modest-hertz/DESIGN.md) — Deep Rose / Ink visual design system, typography hierarchy, component specifications, and states.

