import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Leaf } from "lucide-react";
import { Plant } from "@workspace/api-client-react";
import { useState } from "react";
import { PlantDeleteDialog } from "./PlantDeleteDialog";

interface PlantTableProps {
  plants?: Plant[];
  isLoading: boolean;
  onEdit: (id: number) => void;
}

export function PlantTable({ plants, isLoading, onEdit }: PlantTableProps) {
  const [deletingPlant, setDeletingPlant] = useState<Plant | null>(null);

  return (
    <>
      <div className="overflow-auto flex-1 relative">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Botanical Name</TableHead>
              <TableHead>Common Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Pot Size</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-12 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !plants || plants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Leaf className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No plants found</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                      We couldn't find any plants matching your current filters. Try adjusting your search criteria or add a new plant.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              plants.map((plant) => (
                <TableRow key={plant.id} className="hover:bg-muted/30 transition-colors group">
                  <TableCell>
                    {plant.imageUrl ? (
                      <img 
                        src={plant.imageUrl} 
                        alt={plant.commonName} 
                        className="w-12 h-12 rounded-full object-cover border border-border shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center">
                        <Leaf className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {plant.plantCode}
                  </TableCell>
                  <TableCell className="text-muted-foreground italic">
                    {plant.botanicalName}
                  </TableCell>
                  <TableCell>{plant.commonName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-background">
                      {plant.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{plant.plantType}</TableCell>
                  <TableCell>{plant.potSize}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onEdit(plant.id)}
                        data-testid={`button-edit-plant-${plant.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingPlant(plant)}
                        data-testid={`button-delete-plant-${plant.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <PlantDeleteDialog 
        plant={deletingPlant} 
        onOpenChange={(open) => !open && setDeletingPlant(null)} 
      />
    </>
  );
}