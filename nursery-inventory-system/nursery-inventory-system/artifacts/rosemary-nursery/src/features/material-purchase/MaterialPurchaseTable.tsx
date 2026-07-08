import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag } from "lucide-react";
import { MaterialPurchase } from "@workspace/api-client-react";

interface Props {
  purchases?: MaterialPurchase[];
  isLoading: boolean;
}

function formatNum(v: number, decimals = 2) {
  return v.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function MaterialPurchaseTable({ purchases, isLoading }: Props) {
  return (
    <div className="overflow-auto flex-1 relative">
      <Table>
        <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
          <TableRow>
            <TableHead>Purchase No.</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Unit Cost</TableHead>
            <TableHead className="text-right">Total Cost</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : !purchases || purchases.length === 0
            ? (
              <TableRow>
                <TableCell colSpan={10} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No purchases yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Record your first material purchase to start tracking stock.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )
            : purchases.map((p) => {
                const isLow = p.currentQuantity > 0 && p.currentQuantity / p.quantity <= 0.2;
                const isOut = p.currentQuantity === 0;
                return (
                  <TableRow
                    key={p.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      isOut ? "bg-red-50/50" : isLow ? "bg-amber-50/50" : ""
                    }`}
                  >
                    <TableCell className="font-mono text-sm font-medium">{p.purchaseNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(p.purchaseDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{p.material.name}</div>
                      <div className="text-xs text-muted-foreground">{p.material.materialCode}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.supplier}</TableCell>
                    <TableCell className="text-muted-foreground">{p.stockLocation}</TableCell>
                    <TableCell className="text-right">{formatNum(p.quantity, 0)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.unit}</TableCell>
                    <TableCell className="text-right">{formatNum(p.unitCost, 4)}</TableCell>
                    <TableCell className="text-right">{formatNum(p.totalCost)}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-medium ${
                          isOut
                            ? "text-red-600"
                            : isLow
                            ? "text-amber-600"
                            : "text-foreground"
                        }`}
                      >
                        {formatNum(p.currentQuantity, 2)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
}
