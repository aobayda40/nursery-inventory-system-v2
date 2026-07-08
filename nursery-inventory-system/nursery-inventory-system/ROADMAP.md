# Rosemary Nursery — Development Roadmap

## Phase 1 – Authentication & RBAC ✅ COMPLETED

### Backend
- [x] `User` model (email, name, role, passwordHash, isActive)
- [x] `AuditLog` model (userId, action, entity, entityId, details, ipAddress)
- [x] `Role` enum: Administrator, Manager, Accountant, InventoryController, NurseryStaff
- [x] JWT authentication with httpOnly cookie (`auth_token`, 24h expiry)
- [x] bcryptjs password hashing (cost factor 12)
- [x] Login endpoint (`POST /api/auth/login`)
- [x] Logout endpoint (`POST /api/auth/logout`)
- [x] Current user endpoint (`GET /api/auth/me`)
- [x] `requireAuth` middleware — verifies JWT cookie, attaches `req.user`
- [x] `requireRole(...roles)` middleware — RBAC enforcement
- [x] User CRUD (`GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id`)
- [x] Audit log endpoint (`GET /api/audit-logs` with filters/pagination)
- [x] `createAuditLog` helper used in auth and user routes
- [x] Seed script — creates default `admin@rosemary.local` / `Admin@123456`
- [x] CORS updated to allow credentials; cookie-parser added
- [x] OpenAPI spec updated with auth, users, audit-logs paths and schemas
- [x] Orval client regenerated (api-client-react + api-zod)
- [x] Prisma schema pushed to database

### Frontend
- [x] `AuthContext` — login, logout, refetchUser, isLoading, user state
- [x] `LoginPage` — email/password form with show/hide, server error display
- [x] `ProtectedRoute` — redirects unauthenticated users, shows 403 for wrong role
- [x] `App.tsx` updated — wraps with `AuthProvider`, separates login vs protected routes
- [x] `AppShell` updated — role-based nav visibility, user dropdown (profile/sign-out), role badge in header
- [x] `UserProfile` page — update display name, change password
- [x] `UserManagement` page — list/create/edit/deactivate/delete users (Admin only)
- [x] `AuditLog` page — paginated, filterable activity trail (Admin + Manager)
- [x] Vite proxy configured — `/api/*` → `localhost:8080` in dev

---

## Previously Completed Modules ✅

| Module | Status |
|---|---|
| Dashboard | ✅ Complete |
| Plant Master | ✅ Complete |
| Purchased Plants | ✅ Complete |
| Production | ✅ Complete |
| Project Management | ✅ Complete |
| Plant Issue Tracking | ✅ Complete |
| Inventory Module | ✅ Complete |

---

## Phase 2 – Inventory Control ✅ COMPLETED (Phase 1)

### Backend
- [x] `GET /inventory-items` — search, filter by plant/location, sort by stock
- [x] Weighted-average `costPerPlant` computed from all purchase + production batches
- [x] `inventoryValue = currentStock × costPerPlant` returned per item
- [x] Protected under global `requireAuth` middleware
- [x] OpenAPI spec updated — `InventoryItem`, `InventoryItemPlant` schemas added
- [x] Orval regenerated — `useListInventoryItems` hook + `ListInventoryItemsParams` type

### Frontend
- [x] Summary cards: Plant Types, Total Stock, Total Inventory Value, Stock Alerts
- [x] Table columns: Plant Code, Botanical Name, Common Name, Pot Size, Location, Current Stock, Avg Cost/Plant, Inventory Value
- [x] Search by plant code, name, or location
- [x] Filter by Plant (dropdown from live data)
- [x] Filter by Location (dropdown from live data)
- [x] Sort by Stock (cycle: default → desc → asc → default)
- [x] Low-stock highlighting (amber row + badge) for stock ≤ 10
- [x] Out-of-stock highlighting (red row + badge) for stock = 0
- [x] Tooltip on alert icon explaining threshold
- [x] Row count footer showing filtered vs total

---

## Phase 2b – Inventory Control Phase 2 ✅ COMPLETED

### Backend
- [x] `GET /inventory-items/:id` — full detail with purchase + production batch breakdown
- [x] `GET /inventory-items/:id/movements` — paginated ledger (type, dateFrom, dateTo filters, page/pageSize)
- [x] `GET /inventory-items/:id/movements/export` — CSV download with active filters
- [x] `parseDate()` helper with validation — invalid date strings return 400 (not 500)
- [x] OpenAPI: `InventoryDetail`, `InventoryPurchaseBatch`, `InventoryProductionBatch`, `InventoryMovementRecord`, `InventoryMovementIssue`, `PaginatedInventoryMovements` schemas
- [x] Orval codegen: `useGetInventoryItem`, `useListInventoryMovements` hooks generated
- [x] `postcodegen.mjs` — pattern-based conflict cleanup for orval TS2308 issue (survives future regenerations)

### Frontend
- [x] `batch-stock-table.tsx` — purchase + production batch tables (purchased/issued/remaining columns)
- [x] `movement-ledger.tsx` — paginated ledger with type + date range filters, qty colorised ±, plant-issue links, CSV export button
- [x] `inventory-detail.tsx` — tabbed detail page:
    - Tab 1 "Batch Stock": purchase batch breakdown
    - Tab 2 "Production Batches": production batch breakdown
    - Tab 3 "Movement Ledger": full ledger + filters + pagination + CSV
    - 4 KPI cards: Current Stock, Avg Cost/Plant, Inventory Value, Last Updated
    - Stock alert badges (Low Stock / Out of Stock)
    - Back to Inventory navigation
- [x] `inventory-table.tsx`: clickable rows (cursor-pointer, `onRowClick` prop correctly wired)
- [x] `inventory.tsx`: navigate to `/inventory/:id` on row click
- [x] `App.tsx`: `/inventory/:id` route registered

---

---

## Phase 2c – Material Management Milestone ✅ COMPLETED

### Backend (api-server)
- [x] 6 new Prisma models: `MaterialMaster`, `MaterialPurchase`, `MaterialInventory`, `MaterialIssueLine`, `MaterialMovement`; updated `PlantIssue` with `materialLines`, `materialMovements`, `totalMaterialQuantity`, `totalMaterialValue`
- [x] `syncMaterialInventory()` helper — upserts `MaterialInventory` from sum of `currentQuantity` across purchases
- [x] `GET|POST /material-masters` + `GET|PUT|DELETE /material-masters/:id` — full CRUD with auto-generated `MAT-YYYY-NNNN` codes; blocks delete on history
- [x] `GET /material-masters/categories` — returns 10 fixed categories
- [x] `GET|POST /material-purchases`, `GET /material-purchases/:id` — records purchase, generates `MPO-YYYY-NNNN`, writes `MaterialMovement`, syncs inventory
- [x] `GET /material-inventory`, `GET /material-inventory/:id` (purchase breakdown), `GET /material-inventory/:id/movements` (paginated ledger)
- [x] `GET /available-material-purchases` — lists purchases with remaining stock (used in issue form)
- [x] `plant-issues.ts` upgraded — reads `materialLines` from body, validates stock, decrements `MaterialPurchase.currentQuantity` in transaction, creates `MaterialIssueLine` + `MaterialMovement` ISSUE records, syncs inventory post-commit

### OpenAPI & Codegen
- [x] New tags: `material-masters`, `material-purchases`, `material-inventory`
- [x] New paths + schemas: `MaterialMaster`, `MaterialMasterInput`, `MaterialMasterUpdate`, `MaterialPurchase`, `MaterialPurchaseInput`, `MaterialInventoryItem`, `MaterialInventoryDetail`, `MaterialIssueLine`, `MaterialIssueLineInput`, `AvailableMaterialPurchase`, `PaginatedMaterialMovements`, etc.
- [x] Updated `PlantIssue` response schema: `materialLines`, `totalMaterialQuantity`, `totalMaterialValue`
- [x] Updated `PlantIssueInput` schema: optional `materialLines` array
- [x] Orval codegen regenerated — all hooks generated, libs typecheck passes

### Frontend (rosemary-nursery)
- [x] **Material Master** page + dialog + table (CRUD, auto-code display, category badge colours)
- [x] **Material Purchases** page + sheet form + table (supplier, material, qty, costs, running totals, remaining stock)
- [x] **Inventory** page upgraded to tabbed layout (Plants tab + Materials tab)
- [x] **Materials tab**: `MaterialInventoryTable` + `MaterialInventorySummary` (4 KPI cards, low/out-of-stock badges)
- [x] **Plant Issue → Issue Voucher**: form upgraded with Plants + Materials tabs; material lines wire to available purchase lots; issue voucher label updated to "Plant & Material Issue Voucher"
- [x] **PrintableIssueNote** upgraded — company logo placeholder, Plants section, Materials section, combined grand total, 3-person signature section
- [x] **AppShell** sidebar — "Materials" group with Material Master + Material Purchases; "Issue Voucher" label
- [x] **App.tsx** — `/material-master` and `/material-purchase` routes registered

---

## Phase 3 – Planned (Future)

- [ ] Apply `requireAuth` middleware to all existing routes (plants, batches, projects, etc.)
- [ ] Add `createdBy` / `updatedBy` user references to operational models
- [ ] Audit logging for plant, batch, project, and issue operations
- [ ] Role-based access per module (e.g. only Accountant/Manager can see cost data)
- [ ] Password reset flow
- [ ] Session management / token refresh
- [ ] Reports module (currently placeholder)
- [ ] Settings module (currently placeholder)
- [ ] Export to PDF/Excel

---

## Credentials

| Email | Password | Role |
|---|---|---|
| admin@rosemary.local | Admin@123456 | Administrator |

⚠️ Change the default password immediately after first login.
