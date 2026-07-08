import { useEffect } from "react";
import { useTheme } from "next-themes";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { useHasRole } from "@/contexts/AuthContext";
import { Palette, Loader2, Sun, Moon, Monitor } from "lucide-react";
import { clsx } from "clsx";

const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Enter a valid hex color, e.g. #166534"),
});

type AppearanceFormValues = z.infer<typeof appearanceSchema>;

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System default", icon: Monitor },
] as const;

export function AppearanceSection() {
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const { settings, save, isSaving, isLoading } = useSettings();
  const canEdit = useHasRole("Administrator", "Manager");

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: { theme: "system", primaryColor: "#166534" },
  });

  useEffect(() => {
    if (!isLoading) {
      const theme = (settings["appearance.theme"] as AppearanceFormValues["theme"]) || "system";
      form.reset({
        theme,
        primaryColor: settings["appearance.primaryColor"] || "#166534",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, settings]);

  const onSubmit = async (values: AppearanceFormValues) => {
    try {
      await save({
        "appearance.theme": values.theme,
        "appearance.primaryColor": values.primaryColor,
      });
      setTheme(values.theme);
      toast({ title: "Appearance saved", description: "Your branding preferences have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save appearance settings.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base">Appearance &amp; Branding</CardTitle>
        </div>
        <CardDescription>Choose a theme and accent color for the interface.</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">
        <Form {...form}>
          <fieldset disabled={!canEdit} className="contents">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-appearance">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme preference</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                      >
                        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                          <label
                            key={value}
                            htmlFor={`theme-${value}`}
                            className={clsx(
                              "flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors",
                              field.value === value ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                            )}
                          >
                            <RadioGroupItem value={value} id={`theme-${value}`} />
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Primary Branding Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-9 w-12 rounded border cursor-pointer bg-transparent"
                        />
                        <Input {...field} placeholder="#166534" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canEdit ? (
                <Button type="submit" disabled={isSaving} data-testid="button-save-appearance">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save appearance"
                  )}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Only Administrators and Managers can edit appearance settings.</p>
              )}
            </form>
          </fieldset>
        </Form>
      </CardContent>
    </Card>
  );
}
