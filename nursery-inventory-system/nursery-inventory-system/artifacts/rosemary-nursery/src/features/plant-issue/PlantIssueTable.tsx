import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Printer } from "lucide-react";
import { PlantIssue } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { formatCurrency } from "@/features/production/utils";

interface PlantIssueTableProps {
  issues?: PlantIssue[];
  isLoading: boolean;
}

export function PlantIssueTable({ issues, isLoading }: PlantIssueTableProps) {
  const [, navigate] = useLocation();

  return (
    <div className="overflow-auto flex-1 relative">
      <Table>
        <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
          <TableRow>
            <TableHead>Issue No.</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : !issues || issues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-64 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">No plant issues yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    Create a plant issue voucher to record plants sent to a project site.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            issues.map((issue) => (
              <TableRow key={issue.id} className="hover:bg-muted/30 transition-colors group">
                <TableCell className="font-medium text-foreground">{issue.issueNumber}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(issue.issueDate).toLocaleDateString()}</TableCell>
                <TableCell>{issue.project.projectCode} — {issue.project.projectName}</TableCell>
                <TableCell className="text-muted-foreground">{issue.requestedBy}</TableCell>
                <TableCell className="text-right">{issue.totalQuantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(issue.totalValue)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => navigate(`/plant-issue/${issue.id}`)}
                    title="View / print voucher"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
