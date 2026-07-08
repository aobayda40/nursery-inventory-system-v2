import { useState } from "react";
import { useListMaterialPurchases } from "@workspace/api-client-react";
import { MaterialPurchaseFormSheet } from "@/features/material-purchase/MaterialPurchaseFormSheet";
import { MaterialPurchaseTable } from "@/features/material-purchase/MaterialPurchaseTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function MaterialPurchasePage() {
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: purchases, isLoading } = useListMaterialPurchases({
    search: search || undefined,
  });

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card shrink-0">
        <div>
          <h1 className="text-2xl font-serif text-foreground font-semibold">Material Purchases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record material purchases and track supplier deliveries. Inventory is updated automatically.
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Record Purchase
        </Button>
      </div>

      <div className="p-6 flex flex-col gap-4 flex-1 overflow-hidden">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by purchase no., material, or supplier…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 border rounded-md bg-card overflow-hidden flex flex-col">
          <MaterialPurchaseTable purchases={purchases} isLoading={isLoading} />
        </div>

        {!isLoading && purchases && purchases.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            {purchases.length} purchase record{purchases.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <MaterialPurchaseFormSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
