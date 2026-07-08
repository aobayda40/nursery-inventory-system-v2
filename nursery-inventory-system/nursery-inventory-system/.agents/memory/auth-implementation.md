---
name: Auth & RBAC implementation
description: JWT httpOnly cookie auth for Rosemary Nursery — decisions, quirks, and how to extend
---

## Pattern
- **JWT stored in httpOnly cookie** named `auth_token` (24h expiry)
- Secret from `SESSION_SECRET` env var (already provisioned in Replit)
- bcryptjs cost factor 12 (pure JS — no native bindings needed)
- `requireAuth` middleware in `artifacts/api-server/src/middlewares/auth.ts` attaches `req.user: AuthTokenPayload`
- `requireRole(...roles)` curried middleware for fine-grained RBAC

## Route protection architecture
- Auth routes (`/api/auth/*`) are placed BEFORE `router.use(requireAuth)` in routes/index.ts — login stays public
- All other API routes inherit the global `requireAuth` applied at the router level
- Individual routes layer `requireRole` on top when needed (e.g. users: Administrator only for write ops)

**Why:** Global `requireAuth` at router level prevents accidental exposure of new routes; route-level `requireRole` is additive.

## Roles (Prisma enum)
Administrator, Manager, Accountant, InventoryController, NurseryStaff

## Frontend auth
- `AuthContext` (contexts/AuthContext.tsx) — holds `user`, `login()`, `logout()`, `refetchUser()`, `isLoading`
- `ProtectedRoute` wraps protected pages; redirects to `/login` when unauthenticated; shows 403 for wrong role
- All fetch calls use `credentials: 'include'` to send the httpOnly cookie
- Vite dev proxy routes `/api/*` → `localhost:8080` (configured in vite.config.ts with `API_PORT` env var)

## Seeding
Default admin: `admin@rosemary.local` / `Admin@123456`
Seed script: `artifacts/api-server/src/scripts/seed-admin.ts`
Run via inline node from built dist, or directly with tsx.

## Prisma v7 + db push
Added `datasource: { url: process.env["DATABASE_URL"]! }` to `prisma.config.ts` — required for `db push` (migrate adapter alone wasn't enough).

## CORS
Explicit origin allowlist in app.ts: localhost:5000, localhost:19556, localhost:5173, FRONTEND_URL env, *.replit.dev/app.
Rejects unknown origins when credentials are involved.

## Packages added to api-server
bcryptjs, jsonwebtoken, zod (catalog), @types/bcryptjs, @types/jsonwebtoken
