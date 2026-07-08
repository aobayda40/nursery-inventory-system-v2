import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  useCreateMaterialPurchase,
  useListMaterialMasters,
  getListMaterialPurchasesQueryKey,
  getListMaterialInventoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";

const schema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  materialId: z.coerce.number().min(1, "Select a material"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  unitCost: z.coerce.number().min(0, "Unit cost must be ≥ 0"),
  transportationCost: z.coerce.number().min(0).optional().default(0),
  otherCost: z.coerce.number().min(0).optional().default(0),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  stockLocation: z.string().min(1, "Stock location is required"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialPurchaseFormSheet({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: materials = [] } = useListMaterialMasters();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplier: "",
      materialId: undefined as unknown as number,
      quantity: undefined as unknown as number,
      unit: "",
      unitCost: undefined as unknown as number,
      transportationCost: 0,
      otherCost: 0,
      purchaseDate: new Date().toISOString().slice(0, 10),
      stockLocation: "",
    },
  });

  const watchedMaterialId = form.watch("materialId");
  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === Number(watchedMaterialId)),
    [materials, watchedMaterialId],
  );

  // Auto-fill unit from selected material
  const handleMaterialChange = (id: string) => {
    const mat = materials.find((m) => m.id === Number(id));
    form.setValue("materialId", Number(id));
    if (mat) form.setValue("unit", mat.unit);
  };

  const quantity = Number(form.watch("quantity")) || 0;
  const unitCost = Number(form.watch("unitCost")) || 0;
  const transportationCost = Number(form.watch("transportationCost")) || 0;
  const otherCost = Number(form.watch("otherCost")) || 0;
  const totalCost = quantity * unitCost + transportationCost + otherCost;

  const create = useCreateMaterialPurchase({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMaterialPurchasesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListMaterialInventoryQueryKey() });
        toast({ title: "Material purchase recorded", description: "Inventory updated automatically." });
        form.reset();
        onOpenChange(false);
      },
      onError: (e: any) =>
        toast({ title: "Error", description: e?.message, variant: "destructive" }),
    },
  });

  const onSubmit = (values: FormValues) => {
    create.mutate({ data: values });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Record Material Purchase</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={handleMaterialChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.materialCode} — {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="Supplier name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min={0.001} step="any" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder={selectedMaterial?.unit ?? "pcs"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="unitCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Cost</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="any" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transportationCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transportation Cost</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="any" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otherCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Cost</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="any" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stockLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Warehouse, Greenhouse A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total cost preview */}
            <div className="bg-muted rounded-md px-4 py-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Total Cost</span>
              <span className="font-semibold">
                {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={create.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording…
                  </>
                ) : (
                  "Record Purchase"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
