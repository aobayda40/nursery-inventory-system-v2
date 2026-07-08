import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Boxes, AlertTriangle } from "lucide-react";
import { MaterialInventoryItem } from "@workspace/api-client-react";

interface Props {
  items?: MaterialInventoryItem[];
  isLoading: boolean;
  onRowClick?: (item: MaterialInventoryItem) => void;
}

function formatNum(v: number, decimals = 2) {
  return v.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  Pots: "bg-orange-100 text-orange-800",
  "Soil Mix": "bg-amber-100 text-amber-800",
  Fertilizer: "bg-green-100 text-green-800",
  Chemicals: "bg-red-100 text-red-800",
  Cocopeat: "bg-yellow-100 text-yellow-800",
  "Peat Moss": "bg-lime-100 text-lime-800",
  Compost: "bg-stone-100 text-stone-700",
  Perlite: "bg-sky-100 text-sky-800",
  Vermiculite: "bg-indigo-100 text-indigo-800",
  Others: "bg-gray-100 text-gray-700",
};

export function MaterialInventoryTable({ items, isLoading, onRowClick }: Props) {
  return (
    <div className="overflow-auto flex-1 relative">
      <Table>
        <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Avg Unit Cost</TableHead>
            <TableHead className="text-right">Inventory Value</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : !items || items.length === 0
            ? (
              <TableRow>
                <TableCell colSpan={9} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Boxes className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No material inventory</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Record material purchases to see stock levels here.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )
            : items.map((item) => {
                const isOut = item.currentStock === 0;
                const isLow = !isOut && item.currentStock <= 10;
                return (
                  <TableRow
                    key={item.id}
                    className={`transition-colors ${
                      onRowClick ? "cursor-pointer hover:bg-muted/40" : "hover:bg-muted/30"
                    } ${isOut ? "bg-red-50/50" : isLow ? "bg-amber-50/50" : ""}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {item.material.materialCode}
                    </TableCell>
                    <TableCell className="font-medium">{item.material.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          CATEGORY_COLORS[item.material.category] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.material.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.stockLocation}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNum(item.currentStock, 2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatNum(item.avgUnitCost, 4)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNum(item.inventoryValue)}
                    </TableCell>
                    <TableCell>
                      {isOut ? (
                        <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                      ) : isLow ? (
                        <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-green-700 border-green-200">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
}
