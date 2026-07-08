import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryItem } from "@workspace/api-client-react";
import { formatCurrency, LOW_STOCK_THRESHOLD } from "../utils";
import { Layers, Sprout, DollarSign, AlertTriangle } from "lucide-react";

interface Props {
  items: InventoryItem[];
}

export function InventorySummary({ items }: Props) {
  const totalPlantTypes = new Set(items.map((i) => i.plantId)).size;
  const totalStock = items.reduce((sum, i) => sum + i.currentStock, 0);
  const totalValue = items.reduce((sum, i) => sum + i.inventoryValue, 0);
  const lowStockCount = items.filter(
    (i) => i.currentStock <= LOW_STOCK_THRESHOLD && i.currentStock > 0,
  ).length;
  const outOfStockCount = items.filter((i) => i.currentStock === 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Plant Types</CardTitle>
          <Sprout className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-serif">{totalPlantTypes}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {items.length} location–plant combinations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-serif">
            {totalStock.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">plants across all locations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-serif text-primary">
            {formatCurrency(totalValue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            based on weighted avg cost
          </p>
        </CardContent>
      </Card>

      <Card
        className={
          lowStockCount + outOfStockCount > 0
            ? "border-amber-200 dark:border-amber-800"
            : ""
        }
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
          <AlertTriangle
            className={`h-4 w-4 ${
              lowStockCount + outOfStockCount > 0
                ? "text-amber-500"
                : "text-muted-foreground"
            }`}
          />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold font-serif ${
              lowStockCount + outOfStockCount > 0
                ? "text-amber-600 dark:text-amber-400"
                : ""
            }`}
          >
            {lowStockCount + outOfStockCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {outOfStockCount > 0 && `${outOfStockCount} out of stock · `}
            {lowStockCount > 0 ? `${lowStockCount} low stock` : "no low-stock alerts"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
