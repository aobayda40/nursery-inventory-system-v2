import { useParams, useLocation } from "wouter";
import { useGetPlantIssue, getGetPlantIssueQueryKey } from "@workspace/api-client-react";
import { PrintableIssueNote } from "@/features/plant-issue/PrintableIssueNote";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer } from "lucide-react";

export default function PlantIssueDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = Number(params.id);
  const { data: issue, isLoading } = useGetPlantIssue(id, {
    query: { enabled: !!id, queryKey: getGetPlantIssueQueryKey(id) },
  });

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/plant-issue")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-serif text-foreground font-semibold">Issue Voucher {issue?.issueNumber ?? ""}</h1>
            <p className="text-sm text-muted-foreground mt-1">View, print, or reprint this plant issue voucher.</p>
          </div>
        </div>
        <Button onClick={() => window.print()} disabled={!issue}>
          <Printer className="w-4 h-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        {isLoading ? (
          <div className="max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : issue ? (
          <PrintableIssueNote issue={issue} />
        ) : (
          <p className="text-center text-muted-foreground py-20">Issue voucher not found.</p>
        )}
      </div>
    </div>
  );
}
