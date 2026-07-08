import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { useHasRole } from "@/contexts/AuthContext";
import { SlidersHorizontal, Loader2 } from "lucide-react";

const systemSchema = z.object({
  currency: z.string().min(1),
  dateFormat: z.string().min(1),
  timeFormat: z.string().min(1),
  numberFormat: z.string().min(1),
  units: z.string().min(1),
  language: z.string().min(1),
});

type SystemFormValues = z.infer<typeof systemSchema>;

const CURRENCIES = ["SAR", "USD", "EUR", "GBP", "AED"];
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const TIME_FORMATS = [
  { value: "24h", label: "24-hour" },
  { value: "12h", label: "12-hour (AM/PM)" },
];
const NUMBER_FORMATS = [
  { value: "1,234.56", label: "1,234.56" },
  { value: "1.234,56", label: "1.234,56" },
  { value: "1 234.56", label: "1 234.56" },
];
const UNIT_SYSTEMS = ["Metric", "Imperial"];
const LANGUAGES = ["English", "Arabic"];

export function SystemSection() {
  const { toast } = useToast();
  const { settings, save, isSaving, isLoading } = useSettings();
  const canEdit = useHasRole("Administrator", "Manager");

  const form = useForm<SystemFormValues>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      currency: "SAR",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      numberFormat: "1,234.56",
      units: "Metric",
      language: "English",
    },
  });

  useEffect(() => {
    if (!isLoading) {
      form.reset({
        currency: settings["system.currency"] || "SAR",
        dateFormat: settings["system.dateFormat"] || "DD/MM/YYYY",
        timeFormat: settings["system.timeFormat"] || "24h",
        numberFormat: settings["system.numberFormat"] || "1,234.56",
        units: settings["system.units"] || "Metric",
        language: settings["system.language"] || "English",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, settings]);

  const onSubmit = async (values: SystemFormValues) => {
    try {
      await save({
        "system.currency": values.currency,
        "system.dateFormat": values.dateFormat,
        "system.timeFormat": values.timeFormat,
        "system.numberFormat": values.numberFormat,
        "system.units": values.units,
        "system.language": values.language,
      });
      toast({ title: "System preferences saved", description: "These values are now used across the application." });
    } catch {
      toast({ title: "Error", description: "Failed to save system preferences.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base">System Preferences</CardTitle>
        </div>
        <CardDescription>Regional and formatting defaults used throughout the app.</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">
        <Form {...form}>
          <fieldset disabled={!canEdit} className="contents">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-system">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Language</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Format</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DATE_FORMATS.map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Format</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_FORMATS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numberFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number Format</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NUMBER_FORMATS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Measurement Units</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNIT_SYSTEMS.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {canEdit ? (
                <Button type="submit" disabled={isSaving} data-testid="button-save-system">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save system preferences"
                  )}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Only Administrators and Managers can edit system preferences.</p>
              )}
            </form>
          </fieldset>
        </Form>
      </CardContent>
    </Card>
  );
}
