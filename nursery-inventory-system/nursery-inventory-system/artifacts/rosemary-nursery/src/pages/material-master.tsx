import { useState } from "react";
import { useListMaterialMasters, MaterialMaster } from "@workspace/api-client-react";
import { MaterialMasterTable } from "@/features/material-master/MaterialMasterTable";
import { MaterialMasterDialog } from "@/features/material-master/MaterialMasterDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function MaterialMasterPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialMaster | null>(null);

  const { data: materials, isLoading } = useListMaterialMasters({ search: search || undefined });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (m: MaterialMaster) => {
    setEditing(m);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card shrink-0">
        <div>
          <h1 className="text-2xl font-serif text-foreground font-semibold">Material Master</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your material catalogue — pots, soil mixes, fertilizers, and more.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      <div className="p-6 flex flex-col gap-4 flex-1 overflow-hidden">
        {/* Search bar */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or category…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="flex-1 border rounded-md bg-card overflow-hidden flex flex-col">
          <MaterialMasterTable
            materials={materials}
            isLoading={isLoading}
            onEdit={openEdit}
          />
        </div>

        {!isLoading && materials && materials.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            {materials.length} material{materials.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <MaterialMasterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </div>
  );
}
