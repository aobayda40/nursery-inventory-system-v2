import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useListInventoryMovements } from "@workspace/api-client-react";
import { formatCurrency } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const MOVEMENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "PURCHASE", label: "Purchase (Inflow)" },
  { value: "PRODUCTION", label: "Production (Inflow)" },
  { value: "ISSUANCE", label: "Issuance (Outflow)" },
];

function MovementTypeBadge({ type }: { type: string }) {
  const isOutflow = type === "ISSUANCE" || type.toLowerCase().includes("outflow");
  const isProduction = type === "PRODUCTION";
  if (isOutflow) {
    return (
      <Badge variant="destructive" className="font-mono text-[10px] uppercase tracking-wider shadow-none">
        {type}
      </Badge>
    );
  }
  if (isProduction) {
    return (
      <Badge className="font-mono text-[10px] uppercase tracking-wider shadow-none bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
        {type}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider shadow-none">
      {type}
    </Badge>
  );
}

interface Props {
  itemId: number;
}

export function MovementLedger({ itemId }: Props) {
  const [type, setType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const queryParams = useMemo(
    () => ({
      ...(type ? { type } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      page,
      pageSize,
    }),
    [type, dateFrom, dateTo, page, pageSize],
  );

  const { data, isLoading } = useListInventoryMovements(itemId, queryParams);

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const movements = data?.data ?? [];

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const qs = params.toString();
    return `/api/inventory-items/${itemId}/movements/export${qs ? `?${qs}` : ""}`;
  }, [itemId, type, dateFrom, dateTo]);

  const handleClear = () => {
    setType("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters = Boolean(type || dateFrom || dateTo);

  return (
    <div className="space-y-4">
      {/* Filter + Export bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between bg-muted/30 p-4 rounded-xl border">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Type filter */}
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[170px]"
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
          >
            {MOVEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              className="h-9 w-auto text-sm"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              placeholder="From"
            />
            <span className="text-muted-foreground text-sm">—</span>
            <Input
              type="date"
              className="h-9 w-auto text-sm"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              placeholder="To"
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground h-9">
              Clear
            </Button>
          )}
        </div>

        {/* CSV export */}
        <a href={exportUrl} download>
          <Button variant="outline" size="sm" className="gap-2 h-9 shrink-0">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </a>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="whitespace-nowrap font-semibold">Date</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">Type</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">Batch No.</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">Source</TableHead>
                <TableHead className="text-right whitespace-nowrap font-semibold">Qty</TableHead>
                <TableHead className="text-right whitespace-nowrap font-semibold">Cost/Plant</TableHead>
                <TableHead className="text-right whitespace-nowrap font-semibold">Total Cost</TableHead>
                <TableHead className="font-semibold min-w-[180px]">Issue / Project</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <p className="font-medium text-foreground">No movements recorded.</p>
                      <p className="text-sm mt-1">
                        {hasFilters
                          ? "Try clearing your filters."
                          : "Movements are logged when plants are purchased, produced, or issued."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {format(new Date(m.movementDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <MovementTypeBadge type={m.movementType} />
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-foreground/70">
                      {m.batchNumber}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-accent/50 px-2 py-0.5 text-xs font-medium text-accent-foreground ring-1 ring-inset ring-accent/20">
                        {m.batchSource}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono font-medium ${
                        m.movementType === "ISSUANCE" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {m.movementType === "ISSUANCE" ? "−" : "+"}
                        {m.quantity.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] text-muted-foreground">
                      {formatCurrency(m.costPerPlant)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] font-medium">
                      {formatCurrency(m.totalCost)}
                    </TableCell>
                    <TableCell>
                      {m.plantIssue ? (
                        <Link href={`/plant-issue/${m.plantIssueId}`}>
                          <span className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer">
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="font-medium">{m.plantIssue.issueNumber}</span>
                            <span className="text-muted-foreground">· {m.plantIssue.projectCode}</span>
                          </span>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} movements
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-foreground px-1">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {total > 0 && totalPages === 1 && (
        <p className="text-xs text-muted-foreground text-right">
          {total} movement{total !== 1 ? "s" : ""} total
        </p>
      )}
    </div>
  );
}
