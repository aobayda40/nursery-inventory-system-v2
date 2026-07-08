---
name: Settings module architecture
description: How the Settings feature is implemented in the Rosemary Nursery app
---

The Settings module uses a flat key-value store pattern:
- Prisma model `Setting` has fields: `key` (String @id), `value` (String)
- All settings stored as strings; parsing happens in the API route or frontend context
- Keys follow dot-notation namespaces: `company.*`, `system.*`, `report.*`
- An ALLOWED_KEYS set in the route guards against arbitrary key writes

API endpoints in `src/routes/settings.ts`:
- `GET /api/settings` — requires any authenticated user; returns `{ key, value }[]`
- `PUT /api/settings` — requires Admin or Manager role; bulk upsert
- `GET /api/settings/export` — JSON backup download
- `POST /api/settings/import` — JSON restore

Frontend:
- `SettingsContext.tsx` wraps the app and exposes `settings` (Record<string,string>) + `refreshSettings`
- Settings page uses 4 tab sections: CompanySection, SystemSection, ReportSection, BackupSection
- File uploads (logo, signature) stored as base64 data URLs in the DB; body limit raised to 10MB

**Why:** Flat key-value is simpler than normalized columns and allows arbitrary settings expansion without schema migrations.

**How to apply:** Add new settings by extending ALLOWED_KEYS in the route and adding the key to the relevant tab section component.
