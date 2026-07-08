import { useParams, useLocation } from "wouter";
import { useGetProjectHistory, getGetProjectHistoryQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { formatCurrency } from "@/features/production/utils";

export default function ProjectHistoryPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = Number(params.id);
  const { data, isLoading } = useGetProjectHistory(id, {
    query: { enabled: !!id, queryKey: getGetProjectHistoryQueryKey(id) },
  });

  const totalIssued = data?.issues.reduce((sum, i) => sum + i.totalQuantity, 0) ?? 0;
  const totalValue = data?.issues.reduce((sum, i) => sum + i.totalValue, 0) ?? 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-serif text-foreground font-semibold">
              {isLoading ? "Project History" : `${data?.project.projectCode} — ${data?.project.projectName}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? "Loading project details..." : `${data?.project.clientName} · ${data?.project.projectLocation}`}
            </p>
          </div>
        </div>
        {data?.project.status && (
          <Badge variant={data.project.status === "Active" ? "default" : "secondary"}>{data.project.status}</Badge>
        )}
      </div>

      <div className="p-6 flex-1 overflow-auto space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border rounded-md bg-card p-5">
                <p className="text-sm text-muted-foreground">Total Plants Issued</p>
                <p className="text-2xl font-semibold mt-1">{totalIssued}</p>
              </div>
              <div className="border rounded-md bg-card p-5">
                <p className="text-sm text-muted-foreground">Total Value Issued</p>
                <p className="text-2xl font-semibold mt-1">{formatCurrency(totalValue)}</p>
              </div>
            </div>

            <div className="border rounded-md bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Issue No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data || data.issues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No plants have been issued to this project yet.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.issues.map((issue) => (
                      <TableRow key={issue.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{issue.issueNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(issue.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{issue.requestedBy}</TableCell>
                        <TableCell>{issue.issuedBy}</TableCell>
                        <TableCell className="text-right">{issue.totalQuantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(issue.totalValue)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/plant-issue/${issue.id}`)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
