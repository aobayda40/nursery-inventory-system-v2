---
name: Orval codegen pipeline
description: How to add new API endpoints and regenerate the typed React Query hooks and Zod schemas.
---

## Rule
API contract changes must go through the orval pipeline:
1. Hand-edit `lib/api-spec/openapi.yaml` (add paths, schemas, operationIds).
2. Run `pnpm --filter @workspace/api-spec run codegen` from the monorepo root.
3. This regenerates `@workspace/api-client-react` (React Query hooks) and `@workspace/api-zod` (Zod validation schemas).

**Why:** The generated hooks and schemas are the shared contract between frontend and backend. Editing generated files directly gets overwritten on next codegen.

## Naming conventions (generated)
- Query hooks are `export function use<OperationId>` (e.g. `useGetSettings`, `useExportSettings`).
- Mutation hooks are `export const use<OperationId>` (e.g. `useUpdateSettings`, `useImportSettings`).
- Zod request body schemas are named `<OperationId>Body` (e.g. `UpdateSettingsBody`, `ImportSettingsBody`).
- Zod response schemas are `<OperationId>Response`.
- TypeScript types for schemas are in `@workspace/api-zod` types subfolder; SettingsMap is interface only (not a Zod const).

## Gotcha
`postcodegen.mjs` runs after orval to resolve naming conflicts — don't skip it.
