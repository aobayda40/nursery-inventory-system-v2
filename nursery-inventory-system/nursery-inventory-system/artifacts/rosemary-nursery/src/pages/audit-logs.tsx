import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/contexts/AuthContext";

interface AuditLogUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuditLog {
  id: number;
  userId: number | null;
  user: AuditLogUser | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditLogPage {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-800",
  LOGIN_FAILED: "bg-red-100 text-red-800",
  LOGOUT: "bg-gray-100 text-gray-800",
  CREATE: "bg-blue-100 text-blue-800",
  UPDATE: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
};

const PAGE_LIMIT = 50;

async function fetchAuditLogs(params: {
  entity?: string;
  action?: string;
  offset: number;
}): Promise<AuditLogPage> {
  const query = new URLSearchParams({
    limit: String(PAGE_LIMIT),
    offset: String(params.offset),
  });
  if (params.entity) query.set("entity", params.entity);
  if (params.action) query.set("action", params.action);

  const res = await fetch(`/api/audit-logs?${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load audit logs");
  return res.json() as Promise<AuditLogPage>;
}

export default function AuditLogsPage() {
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(0);

  const offset = page * PAGE_LIMIT;

  const { data, isLoading } = useQuery<AuditLogPage>({
    queryKey: ["audit-logs", entityFilter, actionFilter, offset],
    queryFn: () =>
      fetchAuditLogs({
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
        offset,
      }),
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_LIMIT) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Audit Log</h2>
        <p className="text-sm text-muted-foreground">
          System activity trail — all user actions are recorded here
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter by action…"
            className="pl-9"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
          />
        </div>
        <Select
          value={entityFilter || "__all__"}
          onValueChange={(v) => { setEntityFilter(v === "__all__" ? "" : v); setPage(0); }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All entities</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="PlantMaster">Plant Master</SelectItem>
            <SelectItem value="PlantBatch">Plant Batch</SelectItem>
            <SelectItem value="ProductionBatch">Production Batch</SelectItem>
            <SelectItem value="Project">Project</SelectItem>
            <SelectItem value="PlantIssue">Plant Issue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : !data || data.logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No audit log entries found
                </TableCell>
              </TableRow>
            ) : (
              data.logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div>
                        <p className="text-sm font-medium">{log.user.name}</p>
                        <p className="text-xs text-muted-foreground">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {log.entity}
                      {log.entityId ? ` #${log.entityId}` : ""}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {log.details ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.ipAddress ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {offset + 1}–{Math.min(offset + PAGE_LIMIT, data?.total ?? 0)} of{" "}
            {data?.total ?? 0}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
