import { useEffect, useRef } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { useHasRole } from "@/contexts/AuthContext";
import { Building2, ImagePlus, Loader2, X } from "lucide-react";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  logo: z.string().nullable().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email").or(z.literal("")).optional(),
  website: z.string().optional(),
  taxNumber: z.string().optional(),
  defaultLocation: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export function CompanySection() {
  const { toast } = useToast();
  const { settings, save, isSaving, isLoading } = useSettings();
  const canEdit = useHasRole("Administrator", "Manager");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      logo: null,
      address: "",
      phone: "",
      email: "",
      website: "",
      taxNumber: "",
      defaultLocation: "",
    },
  });

  useEffect(() => {
    // Only reset when not dirty — avoids clobbering in-progress edits
    // when settings refresh (e.g. after another tab saves).
    if (!isLoading && !form.formState.isDirty) {
      form.reset({
        name: settings["company.name"] ?? "",
        logo: settings["company.logo"] || null,
        address: settings["company.address"] ?? "",
        phone: settings["company.phone"] ?? "",
        email: settings["company.email"] ?? "",
        website: settings["company.website"] ?? "",
        taxNumber: settings["company.taxNumber"] ?? "",
        defaultLocation: settings["company.defaultLocation"] ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("logo", reader.result as string, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    form.setValue("logo", null, { shouldDirty: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values: CompanyFormValues) => {
    try {
      await save({
        "company.name": values.name,
        "company.logo": values.logo ?? "",
        "company.address": values.address ?? "",
        "company.phone": values.phone ?? "",
        "company.email": values.email ?? "",
        "company.website": values.website ?? "",
        "company.taxNumber": values.taxNumber ?? "",
        "company.defaultLocation": values.defaultLocation ?? "",
      });
      toast({ title: "Company profile saved", description: "Your company information has been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save company profile.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base">Company Profile</CardTitle>
        </div>
        <CardDescription>
          This information appears on reports, printable documents, and inventory records.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">
        <Form {...form}>
          <fieldset disabled={!canEdit} className="contents">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-company">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  data-testid="input-company-logo"
                />
                {form.watch("logo") ? (
                  <div className="relative h-20 w-20 rounded-md border overflow-hidden group shrink-0">
                    <img src={form.watch("logo") as string} alt="Company logo preview" className="h-full w-full object-contain bg-white" />
                    {canEdit && (
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-destructive text-white rounded-bl p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          removeLogo();
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 w-20 rounded-md border-2 border-dashed bg-muted flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/80 hover:border-primary/50 transition-colors shrink-0"
                  >
                    <ImagePlus className="h-5 w-5 mb-1" />
                    <span className="text-[10px] font-medium">Logo</span>
                  </button>
                )}
                <div>
                  <p className="text-sm font-medium">Company Logo</p>
                  <p className="text-xs text-muted-foreground">PNG or JPG. Used on reports and printable documents.</p>
                  {canEdit && (
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                      Upload logo
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Rosemary Nursery LLC" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT / Tax Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 300000000000003" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Street, City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+966 5x xxx xxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="info@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Main Nursery" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {canEdit ? (
                <Button type="submit" disabled={isSaving} data-testid="button-save-company">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save company profile"
                  )}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Only Administrators and Managers can edit company settings.</p>
              )}
            </form>
          </fieldset>
        </Form>
      </CardContent>
    </Card>
  );
}
