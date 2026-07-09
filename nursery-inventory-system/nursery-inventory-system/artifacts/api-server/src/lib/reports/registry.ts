import type { ReportDefinition } from "./types";

/**
 * Static catalog of reports offered by the Reports module.
 *
 * Adding a new report in Phase 2 means: add its definition here, then
 * implement its data query in `routes/reports.ts` (or a dedicated report
 * service file if the query logic grows large). No schema migration or
 * routing changes are required to introduce a new report id.
 */
export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "inventory",
    name: "Inventory Reports",
    description: "Current stock levels across plants and materials by location.",
    group: "Inventory",
  },
  {
    id: "stock-movement",
    name: "Stock Movement Reports",
    description: "Inbound and outbound movement history for plants and materials.",
    group: "Movements",
  },
  {
    id: "purchase",
    name: "Purchase Reports",
    description: "Plant and material purchase activity, cost, and supplier breakdown.",
    group: "Purchasing",
  },
  {
    id: "sales",
    name: "Sales Reports",
    description: "Plant issuance value and quantity by project and time period.",
    group: "Sales",
  },
  {
    id: "supplier",
    name: "Supplier Reports",
    description: "Supplier performance, purchase volume, and spend summaries.",
    group: "Suppliers",
  },
  {
    id: "low-stock",
    name: "Low Stock Reports",
    description: "Items at or below their configured low-stock threshold.",
    group: "Inventory",
  },
  {
    id: "plant-category",
    name: "Plant Category Reports",
    description: "Inventory and issuance breakdown grouped by plant category.",
    group: "Inventory",
  },
  {
    id: "material-usage",
    name: "Material Usage Reports",
    description: "Material consumption trends across projects and locations.",
    group: "Movements",
  },
];

export function findReportDefinition(id: string): ReportDefinition | undefined {
  return REPORT_DEFINITIONS.find((report) => report.id === id);
}
