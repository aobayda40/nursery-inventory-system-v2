import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plant, useDeletePlant, getListPlantsQueryKey, getGetPlantQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface PlantDeleteDialogProps {
  plant: Plant | null;
  onOpenChange: (open: boolean) => void;
}

export function PlantDeleteDialog({ plant, onOpenChange }: PlantDeleteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const deletePlant = useDeletePlant({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlantsQueryKey() });
        if (plant) {
          queryClient.removeQueries({ queryKey: getGetPlantQueryKey(plant.id) });
        }
        toast({
          title: "Plant deleted",
          description: `${plant?.commonName} has been removed from the catalog.`,
        });
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete the plant. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  return (
    <AlertDialog open={!!plant} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this plant?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{plant?.commonName}</strong> ({plant?.plantCode}) from the plant master catalog. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePlant.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              if (plant) deletePlant.mutate({ id: plant.id });
            }}
            disabled={deletePlant.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deletePlant.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}