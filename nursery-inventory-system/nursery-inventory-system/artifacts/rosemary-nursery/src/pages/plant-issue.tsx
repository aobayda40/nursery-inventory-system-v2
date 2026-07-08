import { useState } from "react";
import { useListPlantIssues } from "@workspace/api-client-react";
import { PlantIssueForm } from "@/features/plant-issue/PlantIssueForm";
import { PlantIssueTable } from "@/features/plant-issue/PlantIssueTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlantIssuePage() {
  const [tab, setTab] = useState("new");
  const { data: issues, isLoading } = useListPlantIssues();

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card shrink-0">
        <div>
          <h1 className="text-2xl font-serif text-foreground font-semibold">
            Plant &amp; Material Issue Voucher
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Issue plants and materials from inventory to project sites and track voucher history.
          </p>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <Tabs value={tab} onValueChange={setTab} className="h-full flex flex-col gap-6">
          <TabsList className="w-fit">
            <TabsTrigger value="new">New Issue</TabsTrigger>
            <TabsTrigger value="history">Issue History</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="flex-1">
            <PlantIssueForm />
          </TabsContent>

          <TabsContent value="history" className="flex-1 flex flex-col border rounded-md bg-card overflow-hidden">
            <PlantIssueTable issues={issues} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
