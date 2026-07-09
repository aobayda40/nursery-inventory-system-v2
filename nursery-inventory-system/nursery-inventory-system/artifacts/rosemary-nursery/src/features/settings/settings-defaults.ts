import type { SettingsMap } from "@workspace/api-client-react";

/**
 * Default values used in SettingsContext.
 * Kept in a separate module (not with the Context component) so that
 * Vite's Fast Refresh can hot-reload the context file without a full page reload.
 */
export const SETTINGS_DEFAULTS: SettingsMap = {
  "company.name": "Rosemary Nursery",
  "company.logo": "",
  "company.address": "",
  "company.phone": "",
  "company.email": "",
  "company.website": "",
  "company.taxNumber": "",
  "company.defaultLocation": "",
  "system.currency": "SAR",
  "system.dateFormat": "DD/MM/YYYY",
  "system.timeFormat": "24h",
  "system.numberFormat": "1,234.56",
  "system.units": "Metric",
  "system.language": "English",
  "inventory.lowStockAlertsEnabled": "true",
  "inventory.lowStockThreshold": "10",
  "inventory.stockCalculationMethod": "FIFO",
  "inventory.allowNegativeInventory": "false",
  "inventory.defaultLocation": "",
  "appearance.theme": "system",
  "appearance.primaryColor": "#166534",
  "backup.lastBackupDate": "",
};
