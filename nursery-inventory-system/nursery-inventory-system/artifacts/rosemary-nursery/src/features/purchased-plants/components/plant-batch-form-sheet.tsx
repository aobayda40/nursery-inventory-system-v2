import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlantBatch, useCreatePlantBatch, useUpdatePlantBatch, useListPlants, getListPlantBatchesQueryKey, getGetPlantBatchQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { plantBatchSchema, PlantBatchFormValues } from "../schema";
import { formatCurrency, generateBatchNumber } from "../utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchToEdit?: PlantBatch | null;
}

export function PlantBatchFormSheet({ open, onOpenChange, batchToEdit }: Props) {
  const queryClient = useQueryClient();
  const createMutation = useCreatePlantBatch();
  const updateMutation = useUpdatePlantBatch();
  const { data: plants } = useListPlants();

  const form = useForm<PlantBatchFormValues>({
    resolver: zodResolver(plantBatchSchema),
    defaultValues: {
      batchNumber: "",
      supplier: "",
      plantId: 0,
      potSize: "",
      quantityPurchased: 1,
      purchasePricePerPlant: 0,
      transportationCost: 0,
      otherCosts: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      currentQuantity: 1,
      nurseryLocation: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (batchToEdit) {
        form.reset({
          batchNumber: batchToEdit.batchNumber,
          supplier: batchToEdit.supplier,
          plantId: batchToEdit.plantId,
          potSize: batchToEdit.potSize,
          quantityPurchased: batchToEdit.quantityPurchased,
          purchasePricePerPlant: batchToEdit.purchasePricePerPlant,
          transportationCost: batchToEdit.transportationCost,
          otherCosts: batchToEdit.otherCosts,
          purchaseDate: batchToEdit.purchaseDate,
          currentQuantity: batchToEdit.currentQuantity,
          nurseryLocation: batchToEdit.nurseryLocation,
        });
      } else {
        form.reset({
          batchNumber: generateBatchNumber(),
          supplier: "",
          plantId: 0,
          potSize: "",
          quantityPurchased: 1,
          purchasePricePerPlant: 0,
          transportationCost: 0,
          otherCosts: 0,
          purchaseDate: new Date().toISOString().split('T')[0],
          currentQuantity: 1,
          nurseryLocation: "",
        });
      }
    }
  }, [open, batchToEdit, form]);

  // form.watch() returns the raw HTML input value (always a string for type="number").
  // Without explicit Number() coercion, the "+" operator string-concatenates instead
  // of adding, e.g. 500 + "0" + "0" = "50000" instead of 500. Always coerce to number.
  const quantityPurchased = Number(form.watch("quantityPurchased")) || 0;
  const purchasePricePerPlant = Number(form.watch("purchasePricePerPlant")) || 0;
  const transportationCost = Number(form.watch("transportationCost")) || 0;
  const otherCosts = Number(form.watch("otherCosts")) || 0;

  const totalBatchCost = (quantityPurchased * purchasePricePerPlant) + transportationCost + otherCosts;
  const costPerPlant = quantityPurchased > 0 ? totalBatchCost / quantityPurchased : 0;

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: PlantBatchFormValues) => {
    if (batchToEdit) {
      const payload = {
        ...values,
        transportationCost: values.transportationCost || 0,
        otherCosts: values.otherCosts || 0,
        currentQuantity: values.currentQuantity,
      };
      updateMutation.mutate({ id: batchToEdit.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPlantBatchesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPlantBatchQueryKey(batchToEdit.id) });
          onOpenChange(false);
        }
      });
    } else {
      // currentQuantity is server-derived on create (= quantityPurchased); omit it
      const { currentQuantity: _omit, ...rest } = values;
      const payload = {
        ...rest,
        transportationCost: rest.transportationCost || 0,
        otherCosts: rest.otherCosts || 0,
      };
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPlantBatchesQueryKey() });
          onOpenChange(false);
        }
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto" aria-describedby="plant-batch-form-description">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-serif text-2xl text-primary">{batchToEdit ? "Edit Plant Batch" : "Add Purchase Batch"}</SheetTitle>
          <SheetDescription id="plant-batch-form-description">
            {batchToEdit 
              ? "Update the details for this plant purchase batch."
              : "Record a new batch of plants entering the nursery inventory."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <FormControl>
                      <Input placeholder="PB-2026-0001" className="font-mono bg-muted/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Evergreen Wholesalers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plant</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          field.onChange(val);
                          const selectedPlant = plants?.find(p => p.id === val);
                          if (selectedPlant && !batchToEdit) {
                            form.setValue("potSize", selectedPlant.potSize);
                          }
                        }}
                      >
                        <option value="" disabled>Select a plant...</option>
                        {plants?.map(p => (
                          <option key={p.id} value={p.id}>{p.plantCode} — {p.commonName}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="potSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pot Size</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 140mm, 200mm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantityPurchased"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty Purchased</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {batchToEdit && (
                <FormField
                  control={form.control}
                  name="currentQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Qty</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="nurseryLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nursery Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Shade House A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
              <h3 className="font-semibold text-sm text-foreground/80">Cost Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="purchasePricePerPlant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Price / Plant</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transportationCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Transport</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherCosts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Other</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-5 border-t border-border/50 mt-4">
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Batch Cost</div>
                  <div className="text-2xl font-bold font-mono text-primary">{formatCurrency(totalBatchCost)}</div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost Per Plant</div>
                  <div className="text-2xl font-bold font-mono text-primary">{formatCurrency(costPerPlant)}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="hover-elevate">
                {isPending ? "Saving..." : batchToEdit ? "Update Batch" : "Add Purchase"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
