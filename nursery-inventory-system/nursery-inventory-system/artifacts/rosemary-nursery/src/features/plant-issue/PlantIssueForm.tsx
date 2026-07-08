import { useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import {
  useListPlants,
  useListProjects,
  useListAvailableBatches,
  useListMaterialMasters,
  useListAvailableMaterialPurchases,
  useCreatePlantIssue,
  getListPlantIssuesQueryKey,
  getListAvailableBatchesQueryKey,
  getListPlantBatchesQueryKey,
  getListMaterialInventoryQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, PackageX } from "lucide-react";
import {
  plantIssueSchema,
  PlantIssueFormValues,
  makeBatchKey,
  parseBatchKey,
  makePurchaseKey,
  parsePurchaseKey,
} from "./schema";
import { formatCurrency } from "@/features/production/utils";

export function PlantIssueForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: plants = [] } = useListPlants();
  const { data: projects = [] } = useListProjects();
  const { data: availableBatches = [] } = useListAvailableBatches();
  const { data: materials = [] } = useListMaterialMasters();
  const { data: availableMaterialPurchases = [] } = useListAvailableMaterialPurchases();

  const activeProjects = useMemo(() => projects.filter((p) => p.status === "Active"), [projects]);

  const form = useForm<PlantIssueFormValues>({
    resolver: zodResolver(plantIssueSchema),
    defaultValues: {
      issueDate: new Date().toISOString().slice(0, 10),
      projectId: undefined as unknown as number,
      requestedBy: "",
      issuedBy: "",
      remarks: "",
      lines: [{ plantId: undefined as unknown as number, batchKey: "", issueQuantity: 1 }],
      materialLines: [],
    },
  });

  const {
    fields: plantFields,
    append: appendPlant,
    remove: removePlant,
  } = useFieldArray({ control: form.control, name: "lines" });

  const {
    fields: matFields,
    append: appendMat,
    remove: removeMat,
  } = useFieldArray({ control: form.control, name: "materialLines" });

  const createIssue = useCreatePlantIssue({
    mutation: {
      onSuccess: (created) => {
        queryClient.invalidateQueries({ queryKey: getListPlantIssuesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListAvailableBatchesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPlantBatchesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListMaterialInventoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({
          title: "Issue voucher created",
          description: `Issue ${created.issueNumber} has been recorded.`,
        });
        navigate(`/plant-issue/${created.id}`);
      },
      onError: (error: any) => {
        const message = error?.message || "Failed to create the issue voucher.";
        toast({ title: "Error", description: message, variant: "destructive" });
      },
    },
  });

  const onSubmit = (values: PlantIssueFormValues) => {
    const lines = values.lines.map((line) => {
      const { batchSource, batchNumber } = parseBatchKey(line.batchKey);
      const batch = availableBatches.find(
        (b) => b.plantId === line.plantId && b.batchNumber === batchNumber && b.batchSource === batchSource,
      );
      return {
        plantId: line.plantId,
        batchNumber,
        batchSource,
        potSize: batch?.potSize ?? "",
        issueQuantity: line.issueQuantity,
      };
    });

    const materialLines = values.materialLines.map((line) => {
      const { stockLocation, purchaseNumber } = parsePurchaseKey(line.purchaseKey);
      const purchase = availableMaterialPurchases.find(
        (p) => p.materialId === line.materialId && p.purchaseNumber === purchaseNumber,
      );
      return {
        materialId: line.materialId,
        purchaseNumber,
        stockLocation,
        unit: purchase?.unit ?? "",
        issueQuantity: line.issueQuantity,
      };
    });

    createIssue.mutate({
      data: {
        issueDate: values.issueDate,
        projectId: values.projectId,
        requestedBy: values.requestedBy,
        issuedBy: values.issuedBy,
        remarks: values.remarks || undefined,
        lines,
        materialLines: materialLines.length > 0 ? materialLines : undefined,
      },
    });
  };

  const watchedLines = form.watch("lines");
  const watchedMatLines = form.watch("materialLines");

  const totalPlantQty = watchedLines.reduce((sum, l) => sum + (Number(l.issueQuantity) || 0), 0);
  const totalMatQty = watchedMatLines.reduce((sum, l) => sum + (Number(l.issueQuantity) || 0), 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Voucher Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Voucher Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeProjects.length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No active projects</div>
                      )}
                      {activeProjects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.projectCode} — {p.projectName}
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
              name="requestedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested By</FormLabel>
                  <FormControl>
                    <Input placeholder="Site engineer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issuedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issued By</FormLabel>
                  <FormControl>
                    <Input placeholder="Nursery staff name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Line Items */}
        <Tabs defaultValue="plants">
          <TabsList>
            <TabsTrigger value="plants">
              Plants ({plantFields.length})
            </TabsTrigger>
            <TabsTrigger value="materials">
              Materials ({matFields.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Plants tab ─────────────────────────────────────── */}
          <TabsContent value="plants">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Plants to Issue</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendPlant({ plantId: undefined as unknown as number, batchKey: "", issueQuantity: 1 })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Row
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-64">Plant</TableHead>
                        <TableHead className="w-72">Batch (Source · Location · Available)</TableHead>
                        <TableHead className="w-24">Pot Size</TableHead>
                        <TableHead className="w-32">Issue Qty</TableHead>
                        <TableHead className="w-32">Value</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plantFields.map((field, index) => {
                        const selectedPlantId = watchedLines[index]?.plantId;
                        const selectedBatchKey = watchedLines[index]?.batchKey;
                        const batchesForPlant = availableBatches.filter((b) => b.plantId === selectedPlantId);
                        const selectedBatch = selectedBatchKey
                          ? (() => {
                              const { batchSource, batchNumber } = parseBatchKey(selectedBatchKey);
                              return batchesForPlant.find(
                                (b) => b.batchNumber === batchNumber && b.batchSource === batchSource,
                              );
                            })()
                          : undefined;
                        const qty = Number(watchedLines[index]?.issueQuantity) || 0;
                        const lineValue = selectedBatch ? selectedBatch.costPerPlant * qty : 0;

                        return (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Controller
                                control={form.control}
                                name={`lines.${index}.plantId`}
                                render={({ field: f }) => (
                                  <Select
                                    value={f.value ? String(f.value) : undefined}
                                    onValueChange={(v) => {
                                      f.onChange(Number(v));
                                      form.setValue(`lines.${index}.batchKey`, "");
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select plant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {plants.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                          {p.plantCode} — {p.commonName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                control={form.control}
                                name={`lines.${index}.batchKey`}
                                render={({ field: f }) => (
                                  <Select
                                    value={f.value || undefined}
                                    onValueChange={f.onChange}
                                    disabled={!selectedPlantId}
                                  >
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={selectedPlantId ? "Select batch" : "Select plant first"}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {batchesForPlant.length === 0 && (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                          No available stock
                                        </div>
                                      )}
                                      {batchesForPlant.map((b) => (
                                        <SelectItem
                                          key={makeBatchKey(b.batchNumber, b.batchSource)}
                                          value={makeBatchKey(b.batchNumber, b.batchSource)}
                                        >
                                          {b.batchNumber} · {b.batchSource === "PURCHASE" ? "Purchased" : "Produced"} ·{" "}
                                          {b.nurseryLocation} · {b.currentQuantity} avail
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {selectedBatch?.potSize ?? "—"}
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`lines.${index}.issueQuantity`}
                                render={({ field: f }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={1}
                                        max={selectedBatch?.currentQuantity}
                                        {...f}
                                      />
                                    </FormControl>
                                    {selectedBatch && qty > selectedBatch.currentQuantity && (
                                      <p className="text-xs text-destructive mt-1">
                                        Max {selectedBatch.currentQuantity}
                                      </p>
                                    )}
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatCurrency(lineValue)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removePlant(index)}
                                disabled={plantFields.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {availableBatches.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <PackageX className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No plant stock is currently available.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Materials tab ────────────────────────────────────── */}
          <TabsContent value="materials">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Materials to Issue</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendMat({
                      materialId: undefined as unknown as number,
                      purchaseKey: "",
                      issueQuantity: 1,
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Row
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-64">Material</TableHead>
                        <TableHead className="w-72">Purchase Lot (Location · Available)</TableHead>
                        <TableHead className="w-24">Unit</TableHead>
                        <TableHead className="w-32">Issue Qty</TableHead>
                        <TableHead className="w-32">Value</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matFields.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                            No materials added. Click "Add Row" to include materials in this voucher.
                          </TableCell>
                        </TableRow>
                      ) : (
                        matFields.map((field, index) => {
                          const selectedMatId = watchedMatLines[index]?.materialId;
                          const selectedPurchaseKey = watchedMatLines[index]?.purchaseKey;
                          const purchasesForMat = availableMaterialPurchases.filter(
                            (p) => p.materialId === selectedMatId,
                          );
                          const selectedPurchase = selectedPurchaseKey
                            ? (() => {
                                const { purchaseNumber } = parsePurchaseKey(selectedPurchaseKey);
                                return purchasesForMat.find((p) => p.purchaseNumber === purchaseNumber);
                              })()
                            : undefined;
                          const qty = Number(watchedMatLines[index]?.issueQuantity) || 0;
                          const lineValue = selectedPurchase ? selectedPurchase.unitCost * qty : 0;

                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Controller
                                  control={form.control}
                                  name={`materialLines.${index}.materialId`}
                                  render={({ field: f }) => (
                                    <Select
                                      value={f.value ? String(f.value) : undefined}
                                      onValueChange={(v) => {
                                        f.onChange(Number(v));
                                        form.setValue(`materialLines.${index}.purchaseKey`, "");
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select material" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {materials.map((m) => (
                                          <SelectItem key={m.id} value={String(m.id)}>
                                            {m.materialCode} — {m.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Controller
                                  control={form.control}
                                  name={`materialLines.${index}.purchaseKey`}
                                  render={({ field: f }) => (
                                    <Select
                                      value={f.value || undefined}
                                      onValueChange={f.onChange}
                                      disabled={!selectedMatId}
                                    >
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={
                                            selectedMatId ? "Select purchase lot" : "Select material first"
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {purchasesForMat.length === 0 && (
                                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                            No available stock
                                          </div>
                                        )}
                                        {purchasesForMat.map((p) => (
                                          <SelectItem
                                            key={makePurchaseKey(p.purchaseNumber, p.stockLocation)}
                                            value={makePurchaseKey(p.purchaseNumber, p.stockLocation)}
                                          >
                                            {p.purchaseNumber} · {p.stockLocation} · {p.currentQuantity} {p.unit} avail
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {selectedPurchase?.unit ?? "—"}
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`materialLines.${index}.issueQuantity`}
                                  render={({ field: f }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={0.001}
                                          step="any"
                                          max={selectedPurchase?.currentQuantity}
                                          {...f}
                                        />
                                      </FormControl>
                                      {selectedPurchase && qty > selectedPurchase.currentQuantity && (
                                        <p className="text-xs text-destructive mt-1">
                                          Max {selectedPurchase.currentQuantity}
                                        </p>
                                      )}
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatCurrency(lineValue)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeMat(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Remarks & Submit */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional remarks for this voucher" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-sm text-muted-foreground space-x-4">
                <span>
                  Plants:{" "}
                  <span className="font-medium text-foreground">{totalPlantQty}</span>
                </span>
                {totalMatQty > 0 && (
                  <span>
                    Materials:{" "}
                    <span className="font-medium text-foreground">{totalMatQty.toFixed(2)} units</span>
                  </span>
                )}
              </div>
              <Button type="submit" disabled={createIssue.isPending}>
                {createIssue.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Issuing...
                  </>
                ) : (
                  "Create Issue Voucher"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
