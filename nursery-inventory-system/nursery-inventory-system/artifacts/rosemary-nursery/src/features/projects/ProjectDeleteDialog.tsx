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
import { Project, useDeleteProject, getListProjectsQueryKey, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ProjectDeleteDialogProps {
  project: Project | null;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDeleteDialog({ project, onOpenChange }: ProjectDeleteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteProject = useDeleteProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        if (project) {
          queryClient.removeQueries({ queryKey: getGetProjectQueryKey(project.id) });
        }
        toast({
          title: "Project deleted",
          description: `${project?.projectName} has been removed.`,
        });
        onOpenChange(false);
      },
      onError: (error: any) => {
        const message =
          error?.status === 409
            ? "This project has issue history and cannot be deleted."
            : "Failed to delete the project. Please try again.";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      },
    },
  });

  return (
    <AlertDialog open={!!project} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{project?.projectName}</strong> ({project?.projectCode}) from the project master. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProject.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (project) deleteProject.mutate({ id: project.id });
            }}
            disabled={deleteProject.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteProject.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
