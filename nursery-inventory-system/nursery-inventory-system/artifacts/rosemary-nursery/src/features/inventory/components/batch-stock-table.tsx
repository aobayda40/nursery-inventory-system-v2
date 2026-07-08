import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "../utils";
import { InventoryPurchaseBatch, InventoryProductionBatch } from "@workspace/api-client-react";

// ─── Purchase Batches ──────────────────────────────────────────────────────────
interface PurchaseBatchTableProps {
  batches: InventoryPurchaseBatch[];
  isLoading?: boolean;
}

export function PurchaseBatchTable({ batches, isLoading }: PurchaseBatchTableProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="whitespace-nowrap font-semibold">Batch No.</TableHead>
              <TableHead className="font-semibold min-w-[140px]">Supplier</TableHead>
              <TableHead className="whitespace-nowrap font-semibold">Purchase Date</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Purchased</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Issued</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Remaining</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Cost/Plant</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Batch Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No purchase batches on record for this location.
                </TableCell>
              </TableRow>
            ) : (
              batches.map((b) => (
                <TableRow key={b.batchNumber} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-[12px] font-medium text-foreground/70">
                    {b.batchNumber}
                  </TableCell>
                  <TableCell className="text-sm">{b.supplier}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(b.purchaseDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right font-mono">{b.quantityPurchased.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono ${b.issuedQuantity > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {b.issuedQuantity.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={b.currentQuantity === 0 ? "destructive" : "secondary"}
                      className="font-mono shadow-none"
                    >
                      {b.currentQuantity.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-muted-foreground">
                    {formatCurrency(b.costPerPlant)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] font-medium">
                    {formatCurrency(b.totalBatchCost)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Production Batches ────────────────────────────────────────────────────────
interface ProductionBatchTableProps {
  batches: InventoryProductionBatch[];
  isLoading?: boolean;
}

export function ProductionBatchTable({ batches, isLoading }: ProductionBatchTableProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="whitespace-nowrap font-semibold">Batch No.</TableHead>
              <TableHead className="whitespace-nowrap font-semibold">Type</TableHead>
              <TableHead className="whitespace-nowrap font-semibold">Production Date</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Produced</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Issued</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Remaining</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Cost/Plant</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Total Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No production batches on record for this location.
                </TableCell>
              </TableRow>
            ) : (
              batches.map((b) => (
                <TableRow key={b.batchNumber} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-[12px] font-medium text-foreground/70">
                    {b.batchNumber}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-accent/50 px-2 py-1 text-xs font-medium text-accent-foreground ring-1 ring-inset ring-accent/20">
                      {b.productionType}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(b.productionDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right font-mono">{b.successfulPlants.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono ${b.issuedQuantity > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {b.issuedQuantity.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={b.currentQuantity === 0 ? "destructive" : "secondary"}
                      className="font-mono shadow-none"
                    >
                      {b.currentQuantity.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-muted-foreground">
                    {formatCurrency(b.costPerPlant)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] font-medium">
                    {formatCurrency(b.totalProductionCost)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
