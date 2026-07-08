import { InventoryItem } from "@workspace/api-client-react";
import { formatCurrency, LOW_STOCK_THRESHOLD } from "../utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  items: InventoryItem[];
  isLoading: boolean;
  onRowClick?: (item: InventoryItem) => void;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <Badge variant="destructive" className="font-mono shadow-none">
        0
      </Badge>
    );
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <Badge className="font-mono shadow-none bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
        {stock.toLocaleString()}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-mono shadow-none">
      {stock.toLocaleString()}
    </Badge>
  );
}

export function InventoryTable({ items, isLoading, onRowClick }: Props) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="whitespace-nowrap font-semibold">Plant Code</TableHead>
              <TableHead className="font-semibold min-w-[160px]">Common Name</TableHead>
              <TableHead className="font-semibold min-w-[200px]">Botanical Name</TableHead>
              <TableHead className="whitespace-nowrap font-semibold">Pot Size</TableHead>
              <TableHead className="font-semibold min-w-[140px]">Location</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">
                Current Stock
              </TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">
                Avg Cost / Plant
              </TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">
                Inventory Value
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-40 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center">
                    <p className="font-medium text-foreground">No inventory items found.</p>
                    <p className="text-sm mt-1">
                      Adjust your filters, or add plants through Purchased Plants or
                      Production.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const isLowStock =
                  item.currentStock > 0 &&
                  item.currentStock <= LOW_STOCK_THRESHOLD;
                const isOutOfStock = item.currentStock === 0;

                return (
                  <TableRow
                    key={item.id}
                    onClick={() => onRowClick?.(item)}
                    className={`transition-colors ${onRowClick ? "cursor-pointer" : ""} hover:bg-muted/40 ${
                      isOutOfStock
                        ? "bg-destructive/5"
                        : isLowStock
                          ? "bg-amber-50/60 dark:bg-amber-900/10"
                          : ""
                    }`}
                  >
                    <TableCell>
                      <span className="font-mono text-[12px] font-medium text-foreground/70 bg-muted/50 px-2 py-0.5 rounded">
                        {item.plant.plantCode}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {item.plant.commonName}
                    </TableCell>
                    <TableCell className="text-muted-foreground italic text-sm">
                      {item.plant.botanicalName}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-accent/50 px-2 py-1 text-xs font-medium text-accent-foreground ring-1 ring-inset ring-accent/20">
                        {item.potSize}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.nurseryLocation}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(isLowStock || isOutOfStock) && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {isOutOfStock
                                ? "Out of stock"
                                : `Low stock — below threshold of ${LOW_STOCK_THRESHOLD}`}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <StockBadge stock={item.currentStock} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] text-muted-foreground">
                      {item.costPerPlant > 0 ? formatCurrency(item.costPerPlant) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] font-medium">
                      {item.inventoryValue > 0 ? formatCurrency(item.inventoryValue) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
