/**
 * Postcodegen cleanup script.
 *
 * Orval generates TypeScript type declarations in lib/api-zod/src/generated/types/
 * AND zod const schemas with identical names in lib/api-zod/src/generated/api.ts for
 * endpoints that have path parameters.  When lib/api-zod/src/index.ts re-exports
 * both via `export *`, TypeScript TS2308 fires.
 *
 * Strategy: read which names are exported as zod consts from api.ts, then strip
 * any re-export in types/index.ts whose local module name resolves to the same
 * exported identifier.  This is pattern-based rather than hard-coding specific
 * file names, so it survives future orval regenerations automatically.
 *
 * Run automatically as part of `pnpm run codegen`.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

const apiTsPath  = resolve(root, "lib/api-zod/src/generated/api.ts");
const indexPath  = resolve(root, "lib/api-zod/src/generated/types/index.ts");

// Collect every name exported as a `const` from api.ts (zod schemas / Params objects).
const apiContent = readFileSync(apiTsPath, "utf8");
const exportedConsts = new Set(
  [...apiContent.matchAll(/^export const (\w+)\s*=/gm)].map((m) => m[1]),
);

// Parse types/index.ts for `export * from './someFile'` lines.
// Derive the exported name from the file name using the same PascalCase convention
// that orval uses: e.g. `./listInventoryMovementsParams` → `ListInventoryMovementsParams`.
const toPascalCase = (kebab) =>
  kebab.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());

let typesIndex = readFileSync(indexPath, "utf8");
let changed = false;

typesIndex = typesIndex.replace(
  /^export \* from '\.\/([^']+)';\n?/gm,
  (line, fileStem) => {
    const exportedName = toPascalCase(fileStem);
    if (exportedConsts.has(exportedName)) {
      changed = true;
      return ""; // remove the conflicting re-export
    }
    return line;
  },
);

if (changed) {
  writeFileSync(indexPath, typesIndex, "utf8");
  console.log("postcodegen: removed conflicting Params re-exports from types/index.ts");
} else {
  console.log("postcodegen: no conflicts found, types/index.ts unchanged");
}
