import { useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { useHasRole } from "@/contexts/AuthContext";
import {
  useExportSettings,
  useImportSettings,
  useListPlants,
  useListMaterialMasters,
} from "@workspace/api-client-react";
import { DatabaseBackup, Download, Upload, Loader2 } from "lucide-react";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    downloadJson(filename.replace(/\.csv$/, ".json"), rows);
    return;
  }
  const headers = Object.keys(rows[0]!);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function BackupSection() {
  const { toast } = useToast();
  const { settings, save } = useSettings();
  const canManage = useHasRole("Administrator", "Manager");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { refetch: refetchExport, isFetching: isExporting } = useExportSettings({
    query: { enabled: false, queryKey: ["settings-export-download"] },
  });
  const importSettings = useImportSettings();
  const { refetch: refetchPlants, isFetching: isExportingPlants } = useListPlants(
    {},
    { query: { enabled: false, queryKey: ["plants-export-download"] } },
  );
  const { refetch: refetchMaterials, isFetching: isExportingMaterials } = useListMaterialMasters(
    {},
    { query: { enabled: false, queryKey: ["materials-export-download"] } },
  );

  const lastBackupDate = settings["backup.lastBackupDate"];

  const handleExportSettings = async () => {
    const { data } = await refetchExport();
    if (data) {
      downloadJson(`settings-backup-${new Date().toISOString().slice(0, 10)}.json`, data);
      await save({ "backup.lastBackupDate": new Date().toISOString() });
      toast({ title: "Backup exported", description: "Settings backup has been downloaded." });
    }
  };

  const handleExportPlants = async () => {
    const { data } = await refetchPlants();
    downloadCsv(`plant-master-${new Date().toISOString().slice(0, 10)}.csv`, (data ?? []) as unknown as Record<string, unknown>[]);
    toast({ title: "Inventory records exported", description: "Plant Master records have been downloaded as CSV." });
  };

  const handleExportMaterials = async () => {
    const { data } = await refetchMaterials();
    downloadCsv(`material-master-${new Date().toISOString().slice(0, 10)}.csv`, (data ?? []) as unknown as Record<string, unknown>[]);
    toast({ title: "Inventory records exported", description: "Material Master records have been downloaded as CSV." });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { settings?: Record<string, string> } & Record<string, unknown>;
      const settingsMap: Record<string, string> =
        parsed.settings && typeof parsed.settings === "object"
          ? parsed.settings
          : (parsed as Record<string, string>);
      await importSettings.mutateAsync({ data: settingsMap });
      toast({ title: "Backup restored", description: "Settings have been imported successfully." });
    } catch {
      toast({ title: "Error", description: "The selected file is not a valid settings backup.", variant: "destructive" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DatabaseBackup className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base">Backup &amp; Data Management</CardTitle>
        </div>
        <CardDescription>
          Export data for safekeeping or migrate settings between environments.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5 space-y-6">
        <div className="rounded-md border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Last backup</p>
            <p className="text-xs text-muted-foreground">
              {lastBackupDate ? new Date(lastBackupDate).toLocaleString() : "No backup has been taken yet"}
            </p>
          </div>
          {canManage && (
            <Button onClick={handleExportSettings} disabled={isExporting} data-testid="button-export-settings">
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export settings backup
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-md border p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Plant Master records</p>
              <p className="text-xs text-muted-foreground">Export the plant catalog as CSV</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportPlants} disabled={isExportingPlants}>
              {isExportingPlants ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
          </div>
          <div className="rounded-md border p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Material Master records</p>
              <p className="text-xs text-muted-foreground">Export the material catalog as CSV</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportMaterials} disabled={isExportingMaterials}>
              {isExportingMaterials ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {canManage && (
          <div className="rounded-md border border-dashed p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Restore from backup</p>
              <p className="text-xs text-muted-foreground">Import a previously exported settings backup (.json)</p>
            </div>
            <input
              type="file"
              accept="application/json"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImportFile}
            />
            <Button variant="outline" onClick={handleImportClick} disabled={importSettings.isPending} data-testid="button-import-settings">
              {importSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import backup
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Full database backups are managed at the infrastructure level. This section covers
          application settings and record exports; contact your administrator for full database
          restore requests.
        </p>
      </CardContent>
    </Card>
  );
}
