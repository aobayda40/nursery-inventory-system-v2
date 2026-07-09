/**
 * Shared types for the Reports module.
 *
 * Phase 1 (foundation) only defines the report catalog and placeholder
 * generation contract. Each report's actual data-fetching logic will be
 * implemented per-report in Phase 2.
 */

export type ReportGroup =
  | "Inventory"
  | "Movements"
  | "Purchasing"
  | "Sales"
  | "Suppliers";

export interface ReportDefinition {
  /** Stable slug used in URLs and as the API identifier. */
  id: string;
  name: string;
  description: string;
  group: ReportGroup;
}
