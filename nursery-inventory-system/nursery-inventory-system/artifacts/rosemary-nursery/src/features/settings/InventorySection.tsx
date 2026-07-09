import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { useHasRole } from "@/contexts/AuthContext";
import { Package, Loader2 } from "lucide-react";

const inventorySchema = z.object({
  lowStockAlertsEnabled: z.boolean(),
  lowStockThreshold: z.coerce.number().int().min(0, "Must be 0 or greater"),
  stockCalculationMethod: z.string().min(1),
  allowNegativeInventory: z.boolean(),
  defaultLocation: z.string().optional(),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

const CALCULATION_METHODS = [
  { value: "FIFO", label: "First In, First Out (FIFO)" },
  { value: "LIFO", label: "Last In, First Out (LIFO)" },
  { value: "Average", label: "Weighted Average Cost" },
];

export function InventorySection() {
  const { toast } = useToast();
  const { settings, save, isSaving, isLoading } = useSettings();
  const canEdit = useHasRole("Administrator", "Manager");

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      lowStockAlertsEnabled: true,
      lowStockThreshold: 10,
      stockCalculationMethod: "FIFO",
      allowNegativeInventory: false,
      defaultLocation: "",
    },
  });

  useEffect(() => {
    if (!isLoading && !form.formState.isDirty) {
      form.reset({
        lowStockAlertsEnabled: settings["inventory.lowStockAlertsEnabled"] !== "false",
        lowStockThreshold: Number(settings["inventory.lowStockThreshold"] || 10),
        stockCalculationMethod: settings["inventory.stockCalculationMethod"] || "FIFO",
        allowNegativeInventory: settings["inventory.allowNegativeInventory"] === "true",
        defaultLocation: settings["inventory.defaultLocation"] ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, settings]);

  const onSubmit = async (values: InventoryFormValues) => {
    try {
      await save({
        "inventory.lowStockAlertsEnabled": String(values.lowStockAlertsEnabled),
        "inventory.lowStockThreshold": String(values.lowStockThreshold),
        "inventory.stockCalculationMethod": values.stockCalculationMethod,
        "inventory.allowNegativeInventory": String(values.allowNegativeInventory),
        "inventory.defaultLocation": values.defaultLocation ?? "",
      });
      toast({ title: "Inventory settings saved", description: "Stock rules have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save inventory settings.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base">Inventory Settings</CardTitle>
        </div>
        <CardDescription>Control stock alerts, valuation method, and default rules.</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">
        <Form {...form}>
          <fieldset disabled={!canEdit} className="contents">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-inventory">
              <FormField
                control={form.control}
                name="lowStockAlertsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <FormLabel className="text-sm font-medium">Enable low stock alerts</FormLabel>
                      <FormDescription>Notify when an item falls below its threshold.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-low-stock-alerts" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Threshold</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stockCalculationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Stock Calculation Method</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CALCULATION_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="defaultLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Inventory Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main Nursery" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowNegativeInventory"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <FormLabel className="text-sm font-medium">Allow negative inventory</FormLabel>
                      <FormDescription>Permit issuing stock beyond what is currently on hand.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {canEdit ? (
                <Button type="submit" disabled={isSaving} data-testid="button-save-inventory">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save inventory settings"
                  )}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Only Administrators and Managers can edit inventory settings.</p>
              )}
            </form>
          </fieldset>
        </Form>
      </CardContent>
    </Card>
  );
}
