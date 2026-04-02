# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS (ADAMAS app)

## Project: ADAMAS

Football match prediction application using Monte Carlo simulation (10,000 iterations).

### Mathematical Models Used
- **Poisson Regression**: Goal scoring distribution
- **Bayesian Inference**: Formation advantage estimation
- **Gaussian/Normal Distribution**: Variance in stats (shots, corners)
- **Law of Large Numbers**: Convergence at 10,000 iterations
- **Multivariable Regression**: Combining xG, shots, form color, injury, formation
- **Empirical Probability**: Final probabilities from simulation counts
- **Monte Carlo Simulation**: Core simulation engine

### Features
- **Simulation Page**: Input form for 2 teams (all match stats) + referee + weather
- **Results Page**: Win probabilities, goals market, top scorelines, bet recommendations
- **Formations Page**: 15 formation matchmaking matrix with win rates
- **History Page**: Saved simulations with delete functionality

### 15 Football Formations
4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 3-4-3, 5-3-2, 4-1-4-1, 4-5-1, 4-3-2-1, 3-4-2-1, 4-4-1-1, 4-3-1-2, 5-4-1, 3-6-1, 4-6-0

### Team Color System
- **Green**: Team in good form (+10% bonus)
- **Yellow**: Neutral form (no adjustment)
- **Red**: Poor form (-10% penalty)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── adamas/             # ADAMAS React+Vite frontend (preview: /)
│   └── api-server/         # Express API server
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           └── betting_history.ts  # Saved simulation history
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## API Routes

- `GET /api/healthz` — Health check
- `POST /api/simulate` — Run Monte Carlo simulation
- `GET /api/formations` — Get all 15 formations with matchmaking data
- `POST /api/formations/matchup` — Get specific formation vs formation analysis
- `GET /api/history` — Get betting history
- `POST /api/history` — Save simulation result
- `DELETE /api/history/:id` — Delete history entry

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/adamas` (`@workspace/adamas`)

ADAMAS React + Vite frontend. Futuristic phosphorescent green + dark theme.

- Entry: `src/main.tsx`
- App setup: `src/App.tsx` — sets up routing, QueryClient, providers
- Pages: simulation form (`/`), results (`/results`), formations (`/formations`), history (`/history`)

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server.

- Monte Carlo engine: `src/lib/montecarlo.ts`
- Formation data: `src/lib/formations.ts`
- Routes: `src/routes/simulation.ts`, `src/routes/formations.ts`, `src/routes/history.ts`

### `lib/db` (`@workspace/db`)

Database schema. Tables:
- `betting_history` — saved simulation results

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval config. Run codegen:
```bash
pnpm --filter @workspace/api-spec run codegen
```

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks used in the frontend.
