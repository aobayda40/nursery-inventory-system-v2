import {
  createContext,
  useContext,
  useCallback,
  useEffect,
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
import { SETTINGS_DEFAULTS } from "@/features/settings/settings-defaults";

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

  // Apply the persisted theme as soon as settings load from the server.
  useEffect(() => {
    if (data?.["appearance.theme"]) {
      setTheme(data["appearance.theme"]);
    }
  }, [data, setTheme]);

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
