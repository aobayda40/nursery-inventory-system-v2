import { useState, useMemo, useEffect } from "react";
import { useListProjects, Project } from "@workspace/api-client-react";
import { ProjectTable } from "@/features/projects/ProjectTable";
import { ProjectDialog } from "@/features/projects/ProjectDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (debouncedSearch) f.search = debouncedSearch;
    return f;
  }, [debouncedSearch]);

  const { data: projects, isLoading } = useListProjects(filters);

  const handleAdd = () => {
    setEditingProject(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card shrink-0">
        <div>
          <h1 className="text-2xl font-serif text-foreground font-semibold">Project Master</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage landscaping projects and clients for plant issuance.</p>
        </div>
        <Button onClick={handleAdd} className="shrink-0" data-testid="button-add-project">
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="shrink-0 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by project, client or code..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 border rounded-md bg-card overflow-hidden flex flex-col relative">
          <ProjectTable projects={projects} isLoading={isLoading} onEdit={handleEdit} />
        </div>
      </div>

      <ProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} project={editingProject} />
    </div>
  );
}
