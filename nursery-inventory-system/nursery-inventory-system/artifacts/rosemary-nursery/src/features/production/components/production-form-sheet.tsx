import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductionBatch, useCreateProductionBatch, useUpdateProductionBatch, useListPlants, getListProductionBatchesQueryKey, getGetProductionBatchQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { productionBatchSchema, ProductionBatchFormValues } from "../schema";
import { formatCurrency, generateProductionBatchNumber, PRODUCTION_TYPES } from "../utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchToEdit?: ProductionBatch | null;
}

const emptyDefaults: ProductionBatchFormValues = {
  productionBatchNumber: "",
  plantId: 0,
  productionType: "",
  rootstockQuantity: 1,
  successfulPlants: 0,
  failedPlants: 0,
  laborCost: 0,
  potCost: 0,
  soilCost: 0,
  fertilizerCost: 0,
  chemicalCost: 0,
  waterCost: 0,
  otherCosts: 0,
  productionDate: new Date().toISOString().split('T')[0],
  nurseryLocation: "",
};

export function ProductionFormSheet({ open, onOpenChange, batchToEdit }: Props) {
  const queryClient = useQueryClient();
  const createMutation = useCreateProductionBatch();
  const updateMutation = useUpdateProductionBatch();
  const { data: plants } = useListPlants();
  const { toast } = useToast();

  const form = useForm<ProductionBatchFormValues>({
    resolver: zodResolver(productionBatchSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (open) {
      if (batchToEdit) {
        form.reset({
          productionBatchNumber: batchToEdit.productionBatchNumber,
          plantId: batchToEdit.plantId,
          productionType: batchToEdit.productionType,
          rootstockQuantity: batchToEdit.rootstockQuantity,
          successfulPlants: batchToEdit.successfulPlants,
          failedPlants: batchToEdit.failedPlants,
          laborCost: batchToEdit.laborCost,
          potCost: batchToEdit.potCost,
          soilCost: batchToEdit.soilCost,
          fertilizerCost: batchToEdit.fertilizerCost,
          chemicalCost: batchToEdit.chemicalCost,
          waterCost: batchToEdit.waterCost,
          otherCosts: batchToEdit.otherCosts,
          productionDate: batchToEdit.productionDate,
          nurseryLocation: batchToEdit.nurseryLocation,
        });
      } else {
        form.reset({
          ...emptyDefaults,
          productionBatchNumber: generateProductionBatchNumber(),
        });
      }
    }
  }, [open, batchToEdit, form]);

  const rootstockQuantity = form.watch("rootstockQuantity") || 0;
  const successfulPlants = form.watch("successfulPlants") || 0;
  const failedPlants = form.watch("failedPlants") || 0;
  const laborCost = form.watch("laborCost") || 0;
  const potCost = form.watch("potCost") || 0;
  const soilCost = form.watch("soilCost") || 0;
  const fertilizerCost = form.watch("fertilizerCost") || 0;
  const chemicalCost = form.watch("chemicalCost") || 0;
  const waterCost = form.watch("waterCost") || 0;
  const otherCosts = form.watch("otherCosts") || 0;

  const totalProductionCost =
    laborCost + potCost + soilCost + fertilizerCost + chemicalCost + waterCost + otherCosts;
  const costPerPlant = successfulPlants > 0 ? totalProductionCost / successfulPlants : 0;
  const accountedFor = successfulPlants + failedPlants;
  const quantityMismatch = accountedFor > rootstockQuantity;

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: ProductionBatchFormValues) => {
    const payload = {
      ...values,
      failedPlants: values.failedPlants || 0,
      laborCost: values.laborCost || 0,
      potCost: values.potCost || 0,
      soilCost: values.soilCost || 0,
      fertilizerCost: values.fertilizerCost || 0,
      chemicalCost: values.chemicalCost || 0,
      waterCost: values.waterCost || 0,
      otherCosts: values.otherCosts || 0,
    };

    if (batchToEdit) {
      updateMutation.mutate({ id: batchToEdit.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductionBatchesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductionBatchQueryKey(batchToEdit.id) });
          queryClient.invalidateQueries({ queryKey: ["listInventoryItems"] });
          onOpenChange(false);
          toast({ title: "Batch Updated", description: `Production batch ${batchToEdit.productionBatchNumber} was updated.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update the production batch.", variant: "destructive" });
        },
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductionBatchesQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["listInventoryItems"] });
          onOpenChange(false);
          toast({ title: "Batch Created", description: "New production batch logged and inventory updated." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create the production batch.", variant: "destructive" });
        },
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto" aria-describedby="production-batch-form-description">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-serif text-2xl text-primary">{batchToEdit ? "Edit Production Batch" : "Log Production Batch"}</SheetTitle>
          <SheetDescription id="production-batch-form-description">
            {batchToEdit
              ? "Update the details for this production batch."
              : "Record a new production run (e.g. grafting) and generate inventory for successful plants."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productionBatchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Batch Number</FormLabel>
                    <FormControl>
                      <Input placeholder="PRB-2026-0001" className="font-mono bg-muted/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
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
                name="productionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Type</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="" disabled>Select type...</option>
                        {PRODUCTION_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <h3 className="font-semibold text-sm text-foreground/80">Plant Quantities</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="rootstockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Rootstock Qty</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="successfulPlants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Successful Plants</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="failedPlants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Failed Plants</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {quantityMismatch && (
                <p className="text-xs text-destructive font-medium">
                  Successful + Failed ({accountedFor}) exceeds Rootstock Quantity ({rootstockQuantity}).
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
              <h3 className="font-semibold text-sm text-foreground/80">Cost Breakdown</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="laborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Labor</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="potCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Pot</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="soilCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Soil</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fertilizerCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Fertilizer</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="chemicalCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Chemical</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="waterCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Water</FormLabel>
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
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Production Cost</div>
                  <div className="text-2xl font-bold font-mono text-primary">{formatCurrency(totalProductionCost)}</div>
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
                {isPending ? "Saving..." : batchToEdit ? "Update Batch" : "Log Production Batch"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
