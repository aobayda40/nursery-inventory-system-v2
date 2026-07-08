import { useState, useMemo } from 'react';
import { useListPlantBatches, useDeletePlantBatch, getListPlantBatchesQueryKey, getGetPlantBatchQueryKey, PlantBatch } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { PurchasedPlantsSummary } from '@/features/purchased-plants/components/purchased-plants-summary';
import { PurchasedPlantsTable } from '@/features/purchased-plants/components/purchased-plants-table';
import { PlantBatchFormSheet } from '@/features/purchased-plants/components/plant-batch-form-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function PurchasedPlants() {
  const [search, setSearch] = useState("");
  const [supplier, setSupplier] = useState<string>("");
  const [nurseryLocation, setNurseryLocation] = useState<string>("");
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<PlantBatch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<PlantBatch | null>(null);

  const queryClient = useQueryClient();
  const deleteMutation = useDeletePlantBatch();
  const { toast } = useToast();

  // We fetch all to get filter dropdown options and summary metrics
  const { data: allBatches = [] } = useListPlantBatches();
  
  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(allBatches.map(b => b.supplier))).filter(Boolean).sort();
  }, [allBatches]);
  
  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(allBatches.map(b => b.nurseryLocation))).filter(Boolean).sort();
  }, [allBatches]);

  // Derived filter payload
  const queryParams = useMemo(() => {
    const params: any = {};
    if (search) params.search = search;
    if (supplier && supplier !== "all") params.supplier = supplier;
    if (nurseryLocation && nurseryLocation !== "all") params.nurseryLocation = nurseryLocation;
    return params;
  }, [search, supplier, nurseryLocation]);

  const { data: filteredBatches = [], isLoading } = useListPlantBatches(queryParams);

  const handleEdit = (batch: PlantBatch) => {
    setBatchToEdit(batch);
    setIsSheetOpen(true);
  };

  const handleCreate = () => {
    setBatchToEdit(null);
    setIsSheetOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!batchToDelete) return;
    deleteMutation.mutate({ id: batchToDelete.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlantBatchesQueryKey() });
        queryClient.removeQueries({ queryKey: getGetPlantBatchQueryKey(batchToDelete.id) });
        setBatchToDelete(null);
        toast({
          title: "Batch Deleted",
          description: `Batch ${batchToDelete.batchNumber} was successfully removed.`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete the batch.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-6 space-y-6 fade-in animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-serif">Purchased Plants</h1>
          <p className="text-muted-foreground mt-1">
            Manage incoming shipments and stock from external growers and suppliers.
          </p>
        </div>
        <Button onClick={handleCreate} className="hover-elevate shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Purchase
        </Button>
      </div>

      <PurchasedPlantsSummary batches={allBatches} />

      <div className="flex flex-col lg:flex-row gap-4 mb-2 items-start lg:items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search batches, suppliers, plants..." 
            className="pl-9 w-full bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 px-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter by:</span>
          </div>
          
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-[150px]"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          >
            <option value="all">All Suppliers</option>
            {uniqueSuppliers.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-[150px]"
            value={nurseryLocation}
            onChange={(e) => setNurseryLocation(e.target.value)}
          >
            <option value="all">All Locations</option>
            {uniqueLocations.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {(search || (supplier !== "" && supplier !== "all") || (nurseryLocation !== "" && nurseryLocation !== "all")) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSearch("");
                setSupplier("all");
                setNurseryLocation("all");
              }}
              className="text-muted-foreground"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <PurchasedPlantsTable 
        batches={filteredBatches} 
        isLoading={isLoading} 
        onEdit={handleEdit}
        onDelete={setBatchToDelete}
      />

      <PlantBatchFormSheet 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
        batchToEdit={batchToEdit} 
      />

      <AlertDialog open={!!batchToDelete} onOpenChange={(open) => !open && setBatchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">Delete Batch {batchToDelete?.batchNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the batch record and reduce inventory accordingly. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
