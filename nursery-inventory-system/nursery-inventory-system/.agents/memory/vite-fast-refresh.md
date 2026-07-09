---
name: Vite Fast Refresh in context files
description: Why mixing non-component exports with React components in a file breaks Vite HMR.
---

## Rule
A file that exports React components (including providers/hooks) must NOT also export plain constants or objects. Vite's react Fast Refresh requires files to export only components (or only non-components).

**Why:** Mixing causes "Could not Fast Refresh" warnings; Vite falls back to a full module reload instead of component-level HMR, which disrupts state during development.

**How to apply:** Move shared constants (like `SETTINGS_DEFAULTS`) to a dedicated `*-defaults.ts` or `constants.ts` file. Import them into the context file without re-exporting. Any other files that need the constant import directly from the constants file.

## Example (this project)
- Bad: `SettingsContext.tsx` exporting both `SettingsProvider` and `SETTINGS_DEFAULTS`.
- Fixed: `settings-defaults.ts` exports `SETTINGS_DEFAULTS`; `SettingsContext.tsx` imports it and does NOT re-export it.
