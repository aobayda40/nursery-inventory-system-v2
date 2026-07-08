import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
  type SettingsMap,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

/** Defaults shown until the server responds / for keys never saved. */
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

interface SettingsContextValue {
  /** Effective settings: server values merged over defaults. */
  settings: SettingsMap;
  isLoading: boolean;
  get: (key: keyof typeof SETTINGS_DEFAULTS) => string;
  /** Bulk-save one or more settings (Administrator/Manager only on the server). */
  save: (
    values: Partial<SettingsMap>,
  ) => Promise<SettingsMap>;
  isSaving: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();
  const { data, isLoading } = useGetSettings();

  const settings = useMemo<SettingsMap>(
    () => ({ ...SETTINGS_DEFAULTS, ...(data ?? {}) }),
    [data],
  );

  const updateSettings = useUpdateSettings({
    mutation: {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetSettingsQueryKey(), updated);
        if (updated["appearance.theme"]) {
          setTheme(updated["appearance.theme"]);
        }
      },
    },
  });

  const get = useCallback(
    (key: keyof typeof SETTINGS_DEFAULTS) => settings[key] ?? "",
    [settings],
  );

  const save = useCallback(
    (values: Partial<SettingsMap>) =>
      updateSettings.mutateAsync({ data: values as SettingsMap }),
    [updateSettings],
  );

  return (
    <SettingsContext.Provider
      value={{ settings, isLoading, get, save, isSaving: updateSettings.isPending }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
