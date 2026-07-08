import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Edit2, Trash2, Package } from "lucide-react";
import {
  useDeleteMaterialMaster,
  getListMaterialMastersQueryKey,
  MaterialMaster,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Props {
  materials?: MaterialMaster[];
  isLoading: boolean;
  onEdit: (material: MaterialMaster) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Pots: "bg-orange-100 text-orange-800",
  "Soil Mix": "bg-amber-100 text-amber-800",
  Fertilizer: "bg-green-100 text-green-800",
  Chemicals: "bg-red-100 text-red-800",
  Cocopeat: "bg-yellow-100 text-yellow-800",
  "Peat Moss": "bg-lime-100 text-lime-800",
  Compost: "bg-brown-100 text-stone-700",
  Perlite: "bg-sky-100 text-sky-800",
  Vermiculite: "bg-indigo-100 text-indigo-800",
  Others: "bg-gray-100 text-gray-700",
};

export function MaterialMasterTable({ materials, isLoading, onEdit }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<MaterialMaster | null>(null);

  const deleteMutation = useDeleteMaterialMaster({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMaterialMastersQueryKey() });
        toast({ title: "Material deleted" });
        setDeleteTarget(null);
      },
      onError: (e: any) => {
        toast({
          title: "Cannot delete",
          description: e?.message ?? "This material has purchase or issue history.",
          variant: "destructive",
        });
        setDeleteTarget(null);
      },
    },
  });

  return (
    <>
      <div className="overflow-auto flex-1 relative">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : !materials || materials.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground">No materials yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add your first material to get started.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )
              : materials.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="font-mono text-sm font-medium">{m.materialCode}</TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          CATEGORY_COLORS[m.category] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {m.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.unit}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                      {m.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onEdit(m)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeleteTarget(m)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.materialCode}). 
              Materials with purchase or issue history cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
