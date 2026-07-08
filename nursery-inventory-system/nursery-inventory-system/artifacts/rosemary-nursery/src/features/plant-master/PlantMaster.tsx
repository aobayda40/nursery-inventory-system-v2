import { useState, useMemo, useEffect } from "react";
import { useListPlants } from "@workspace/api-client-react";
import { PlantTable } from "./PlantTable";
import { PlantFilters } from "./PlantFilters";
import { PlantDialog } from "./PlantDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function PlantMaster() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [plantType, setPlantType] = useState<string>("");
  const [potSize, setPotSize] = useState<string>("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch all plants to derive unique filter options
  const { data: allPlants = [] } = useListPlants();

  const uniqueCategories = useMemo(() => Array.from(new Set(allPlants.map(p => p.category).filter(Boolean))).sort(), [allPlants]);
  const uniquePlantTypes = useMemo(() => Array.from(new Set(allPlants.map(p => p.plantType).filter(Boolean))).sort(), [allPlants]);
  const uniquePotSizes = useMemo(() => Array.from(new Set(allPlants.map(p => p.potSize).filter(Boolean))).sort(), [allPlants]);

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (debouncedSearch) f.search = debouncedSearch;
    if (category && category !== "all") f.category = category;
    if (plantType && plantType !== "all") f.plantType = plantType;
    if (potSize && potSize !== "all") f.potSize = potSize;
    return f;
  }, [debouncedSearch, category, plantType, potSize]);

  const { data: plants, isLoading } = useListPlants(filters);

  const handleAdd = () => {
    setEditingPlantId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (id: number) => {
    setEditingPlantId(id);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card shrink-0">
        <div>
          <h1 className="text-2xl font-serif text-foreground font-semibold">Plant Master</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage the central catalog of all plant species and varieties.</p>
        </div>
        <Button onClick={handleAdd} className="shrink-0" data-testid="button-add-plant">
          <Plus className="w-4 h-4 mr-2" />
          Add Plant
        </Button>
      </div>
      
      <div className="p-6 flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="shrink-0">
          <PlantFilters 
            search={search} onSearchChange={setSearch}
            category={category} onCategoryChange={setCategory} categories={uniqueCategories}
            plantType={plantType} onPlantTypeChange={setPlantType} plantTypes={uniquePlantTypes}
            potSize={potSize} onPotSizeChange={setPotSize} potSizes={uniquePotSizes}
          />
        </div>
        
        <div className="flex-1 border rounded-md bg-card overflow-hidden flex flex-col relative">
          <PlantTable plants={plants} isLoading={isLoading} onEdit={handleEdit} />
        </div>
      </div>

      <PlantDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        plantId={editingPlantId} 
      />
    </div>
  );
}