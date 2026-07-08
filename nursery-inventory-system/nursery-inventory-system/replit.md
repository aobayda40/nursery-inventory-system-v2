# Rosemary Nursery — Production & Inventory Management System

A purpose-built system for Rosemary Contracting Company's nursery arm to track plant inventory and production costs. Not a full ERP — scoped to nursery production and inventory management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/rosemary-nursery run dev` — run the frontend (port 19556)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-server run prisma:generate` — regenerate Prisma client from schema
- `pnpm --filter @workspace/api-server run prisma:push` — push DB schema changes (dev only, no migration history)
- `pnpm --filter @workspace/api-server run prisma:migrate` — create and run a migration (dev)
- `pnpm --filter @workspace/api-server run prisma:studio` — open Prisma Studio GUI
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + shadcn/ui + wouter (routing)
- API: Express 5
- DB: PostgreSQL + Prisma ORM v7
- Build: esbuild (API CJS bundle), Vite (frontend static)

## Where things live

- `artifacts/rosemary-nursery/src/` — React frontend
  - `src/components/layout/` — AppShell, sidebar, header
  - `src/pages/` — one file per route (placeholder pages initially)
  - `src/index.css` — Tailwind theme tokens and CSS variables
- `artifacts/api-server/src/` — Express API server
  - `src/lib/prisma.ts` — Prisma client singleton (adapter-pg pattern for Prisma v7)
  - `src/routes/` — route handlers
- `artifacts/api-server/prisma/schema.prisma` — DB schema (models added here)
- `artifacts/api-server/prisma.config.ts` — Prisma v7 config (datasource URL lives here)

## Architecture decisions

- **Prisma v7** requires the adapter pattern: datasource `url` is no longer in `schema.prisma`. Instead, `prisma.config.ts` configures the migrate adapter and `PrismaClient` receives a `PrismaPg` adapter at runtime. Run `prisma:generate` after every schema change.
- **Sidebar navigation** is collapsible: full label+icon on desktop, collapses to icon-only strip. Active route is highlighted via wouter's `useRoute`.
- **`lib/db` (Drizzle)** is still present in the monorepo template but unused by this project — Prisma is the ORM of record.

## Modules (sidebar)

| Route | Module | Status | Roles |
|---|---|---|---|
| `/` | Dashboard | ✅ Complete | All |
| `/plant-master` | Plant Master | ✅ Complete | All |
| `/inventory` | Inventory | ✅ Complete | All |
| `/purchased-plants` | Purchased Plants | ✅ Complete | All |
| `/production` | Production | ✅ Complete | All |
| `/projects` | Projects | ✅ Complete | All |
| `/plant-issue` | Plant Issue | ✅ Complete | All |
| `/reports` | Reports | Placeholder | All |
| `/settings` | Settings | Placeholder | All |
| `/profile` | User Profile | ✅ Complete | All |
| `/users` | User Management | ✅ Complete | Administrator, Manager |
| `/audit-logs` | Audit Log | ✅ Complete | Administrator, Manager |
| `/login` | Login | ✅ Complete | Public |

## Authentication

- Default admin: `admin@rosemary.local` / `Admin@123456` — **change after first login**
- JWT stored in httpOnly cookie (`auth_token`, 24h expiry)
- Roles: Administrator, Manager, Accountant, InventoryController, NurseryStaff
- Seed: `pnpm --filter @workspace/api-server run seed:admin`

## User preferences

- Tech stack: React, TypeScript, Express, PostgreSQL, Prisma, Tailwind CSS, shadcn/ui

## Gotchas

- Always run `prisma:generate` after editing `schema.prisma` or the TypeScript types will be stale.
- Prisma v7 does NOT support `url = env("DATABASE_URL")` in `schema.prisma`. The connection string belongs in `prisma.config.ts` (for migrate) and in the `PrismaPg` adapter constructor (for runtime).
- Do not run `pnpm dev` at the workspace root — use the managed workflows or the per-package commands above.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Prisma v7 adapter docs: https://pris.ly/d/config-datasource
