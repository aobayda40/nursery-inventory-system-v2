import { useParams, useLocation } from "wouter";
import { useGetInventoryItem } from "@workspace/api-client-react";
import { format } from "date-fns";
import { PurchaseBatchTable, ProductionBatchTable } from "@/features/inventory/components/batch-stock-table";
import { MovementLedger } from "@/features/inventory/components/movement-ledger";
import { formatCurrency, LOW_STOCK_THRESHOLD } from "@/features/inventory/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Layers,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  ShoppingCart,
  FlaskConical,
} from "lucide-react";

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const itemId = Number(id);
  const [, navigate] = useLocation();

  const { data: item, isLoading } = useGetInventoryItem(itemId);

  const isLowStock = item && item.currentStock > 0 && item.currentStock <= LOW_STOCK_THRESHOLD;
  const isOutOfStock = item && item.currentStock === 0;

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-6 space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/inventory")}
        className="w-fit -ml-2 text-muted-foreground hover:text-foreground gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          {isLoading ? (
            <>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-48" />
            </>
          ) : item ? (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight text-primary font-serif">
                  {item.plant.commonName}
                </h1>
                <Badge variant="outline" className="font-mono text-sm bg-muted/30">
                  {item.plant.plantCode}
                </Badge>
                {(isLowStock || isOutOfStock) && (
                  <Badge
                    variant={isOutOfStock ? "destructive" : "outline"}
                    className={`gap-1 ${
                      isLowStock && !isOutOfStock
                        ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                        : ""
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {isOutOfStock ? "Out of Stock" : "Low Stock"}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 italic text-sm">
                {item.plant.botanicalName}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center rounded-md bg-accent/50 px-2 py-0.5 text-xs font-medium text-accent-foreground ring-1 ring-inset ring-accent/20">
                  {item.potSize}
                </span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-sm text-muted-foreground">{item.nurseryLocation}</span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Item not found.</p>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-20" /></CardContent>
            </Card>
          ))}
        </div>
      ) : item ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={isOutOfStock ? "border-destructive/30" : isLowStock ? "border-amber-200 dark:border-amber-800" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
              <Layers className={`h-4 w-4 ${isOutOfStock ? "text-destructive" : isLowStock ? "text-amber-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-serif ${isOutOfStock ? "text-destructive" : isLowStock ? "text-amber-600 dark:text-amber-400" : ""}`}>
                {item.currentStock.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isOutOfStock ? "No stock available" : isLowStock ? `≤ ${LOW_STOCK_THRESHOLD} — reorder needed` : "plants available"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost / Plant</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif font-mono">
                {item.costPerPlant > 0 ? formatCurrency(item.costPerPlant) : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">weighted across batches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-primary">
                {item.inventoryValue > 0 ? formatCurrency(item.inventoryValue) : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">stock × avg cost</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">
                {format(new Date(item.updatedAt), "MMM d")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(item.updatedAt), "yyyy, h:mm a")}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Tabs: Batch Stock Breakdown + Movement Ledger */}
      <Tabs defaultValue="batches" className="space-y-4">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="batches" className="gap-2">
            <ShoppingCart className="h-3.5 w-3.5" />
            Batch Stock
          </TabsTrigger>
          <TabsTrigger value="production" className="gap-2">
            <FlaskConical className="h-3.5 w-3.5" />
            Production Batches
          </TabsTrigger>
          <TabsTrigger value="ledger" className="gap-2">
            <Layers className="h-3.5 w-3.5" />
            Movement Ledger
          </TabsTrigger>
        </TabsList>

        {/* Purchase batch breakdown */}
        <TabsContent value="batches" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Purchase Batch Breakdown</h3>
              <p className="text-sm text-muted-foreground">
                All purchase batches for this plant × pot size × location.
              </p>
            </div>
            {!isLoading && item && (
              <Badge variant="secondary" className="font-mono">
                {item.purchaseBatches.length} batch{item.purchaseBatches.length !== 1 ? "es" : ""}
              </Badge>
            )}
          </div>
          <PurchaseBatchTable
            batches={item?.purchaseBatches ?? []}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Production batch breakdown */}
        <TabsContent value="production" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Production Batch Breakdown</h3>
              <p className="text-sm text-muted-foreground">
                All production batches (grafts, cuttings, etc.) contributing to this item.
              </p>
            </div>
            {!isLoading && item && (
              <Badge variant="secondary" className="font-mono">
                {item.productionBatches.length} batch{item.productionBatches.length !== 1 ? "es" : ""}
              </Badge>
            )}
          </div>
          <ProductionBatchTable
            batches={item?.productionBatches ?? []}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Movement ledger */}
        <TabsContent value="ledger" className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">Movement Ledger</h3>
            <p className="text-sm text-muted-foreground">
              Full history of stock inflows and outflows — purchases, production, and issuances.
            </p>
          </div>
          {!isLoading && <MovementLedger itemId={itemId} />}
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
