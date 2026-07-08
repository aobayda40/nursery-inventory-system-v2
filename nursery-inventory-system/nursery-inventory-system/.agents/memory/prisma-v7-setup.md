---
name: Prisma v7 setup
description: How Prisma v7 is configured in this monorepo — schema, config file, client singleton, and db push workaround
---

## Rule
Prisma v7 does NOT support `url = env("DATABASE_URL")` in `schema.prisma`. The datasource block must have NO `url` field. The connection is provided via an adapter at runtime.

**Why:** Prisma v7 moved to an adapter-first architecture. The datasource URL was removed from schema files and must live in `prisma.config.ts` for migrate commands, and in the `PrismaClient` constructor (via `PrismaPg`) for runtime.

## How to apply

**schema.prisma** — no url:
```prisma
datasource db {
  provider = "postgresql"
}
```

**prisma.config.ts** — import pg and PrismaPg at top level (not dynamic import):
```ts
import { defineConfig } from "prisma/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrate: {
    async adapter(env) {
      const pool = new pg.Pool({ connectionString: env["DATABASE_URL"] });
      return new PrismaPg(pool);
    },
  },
});
```

**src/lib/prisma.ts** — singleton with adapter:
```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function createPrismaClient() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

declare global { var __prisma: PrismaClient | undefined; }
export const prisma = globalThis.__prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;
```

Required packages: `@prisma/client`, `prisma` (dev), `@prisma/adapter-pg`, `pg`, `@types/pg` (dev)

## db push workaround
`prisma db push` still fails with "datasource.url required" even with correct config. 
Workaround: create tables directly via `executeSql()` and add `updatedAt` trigger manually:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW."updatedAt" = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER set_<table>_updated_at BEFORE UPDATE ON "<Table>"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## After schema changes
Always run `pnpm --filter @workspace/api-server run prisma:generate` after editing schema.prisma.
For new tables, use executeSql + trigger pattern above.

## Prisma error codes in routes
- `P2002` = unique constraint violation → 409
- `P2025` = record not found → 404
