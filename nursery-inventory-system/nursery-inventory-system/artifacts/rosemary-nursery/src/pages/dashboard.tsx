import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sprout, CalendarDays, Wallet, Trophy } from "lucide-react";
import { formatCurrency } from "@/features/production/utils";

export default function Dashboard() {
  const { data, isLoading } = useGetDashboardSummary();

  const cards = [
    {
      label: "Plants Issued Today",
      value: data?.plantsIssuedToday ?? 0,
      icon: Sprout,
    },
    {
      label: "Plants Issued This Month",
      value: data?.plantsIssuedThisMonth ?? 0,
      icon: CalendarDays,
    },
    {
      label: "Inventory Value Issued This Month",
      value: formatCurrency(data?.inventoryValueIssuedThisMonth ?? 0),
      icon: Wallet,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 py-5 border-b bg-card shrink-0">
        <h1 className="text-2xl font-serif text-foreground font-semibold">Nursery Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">A top-level overview of nursery production and plant issuance activity.</p>
      </div>

      <div className="p-6 flex-1 overflow-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground mt-0.5">{card.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Top Projects by Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !data || data.topProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No plants have been issued to any project yet.
              </p>
            ) : (
              <div className="space-y-1">
                {data.topProjects.map((project, index) => (
                  <div
                    key={project.projectId}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{project.projectName}</p>
                        <p className="text-xs text-muted-foreground">{project.projectCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{project.totalQuantity} plants</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(project.totalValue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
