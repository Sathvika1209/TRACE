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

---

## Documentation & Showcase

- **Design System Showcase:** Navigate to `/design-system` in development to interactively inspect design tokens, typography, UI primitives, and representative components.
- [PRODUCT.md](file:///c:/Users/Sathvika/Documents/antigravity/modest-hertz/PRODUCT.md) — Product thesis, principles, MVP scope, and stretch goals.
- [ARCHITECTURE.md](file:///c:/Users/Sathvika/Documents/antigravity/modest-hertz/ARCHITECTURE.md) — System boundaries, data flow, checkpoint concept, and trade-offs.
- [DESIGN.md](file:///c:/Users/Sathvika/Documents/antigravity/modest-hertz/DESIGN.md) — Visual design tokens, Deep Rose / Ink palette, typography hierarchy, and UI component specifications.
