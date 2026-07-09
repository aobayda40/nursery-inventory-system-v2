---
name: Settings key/value design
description: How the Settings model is structured and why; critical constraints for future additions.
---

## Rule
`Setting` model uses `key` (String PK) + `value` (String) + `updatedAt`. Keys are namespaced (e.g. `company.*`, `system.*`, `appearance.*`). New settings only need a new key in ALLOWED_KEYS — no schema migration required.

**Why:** Avoids rigid column-per-setting schema; allows adding settings without Prisma migrations, important for a hosted multi-tenant environment.

**How to apply:** When adding a new setting, add the key string to `ALLOWED_KEYS` in `artifacts/api-server/src/routes/settings.ts` AND add a default to `artifacts/rosemary-nursery/src/features/settings/settings-defaults.ts`. Keep the namespace pattern (`section.camelCaseKey`).

## Constraints
- Server-side logo size guard: values for `company.logo` must be ≤ 2,800,000 chars (~2 MB base64).
- Import endpoint silently skips unknown keys (allow-list filter); PUT endpoint rejects with 400.
- GET /settings is open to any authenticated user (needed app-wide for theme/currency); PUT/export/import require Administrator or Manager.
