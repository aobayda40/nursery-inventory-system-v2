import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlantFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  categories: string[];
  plantType: string;
  onPlantTypeChange: (val: string) => void;
  plantTypes: string[];
  potSize: string;
  onPotSizeChange: (val: string) => void;
  potSizes: string[];
}

export function PlantFilters({
  search, onSearchChange,
  category, onCategoryChange, categories,
  plantType, onPlantTypeChange, plantTypes,
  potSize, onPotSizeChange, potSizes
}: PlantFiltersProps) {
  
  const hasFilters = search || (category && category !== 'all') || (plantType && plantType !== 'all') || (potSize && potSize !== 'all');

  const clearFilters = () => {
    onSearchChange("");
    onCategoryChange("all");
    onPlantTypeChange("all");
    onPotSizeChange("all");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search plants by name or code..." 
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-background w-full"
            data-testid="input-search-plants"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          <Select value={category || "all"} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Select value={plantType || "all"} onValueChange={onPlantTypeChange}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Plant Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {plantTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={potSize || "all"} onValueChange={onPotSizeChange}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Pot Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              {potSizes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-9 px-3">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}