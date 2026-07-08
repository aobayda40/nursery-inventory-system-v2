import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  useListInventoryItems,
  getListInventoryItemsQueryKey,
  InventoryItem,
  useListMaterialInventory,
  MaterialInventoryItem,
} from "@workspace/api-client-react";
import { InventorySummary } from "@/features/inventory/components/inventory-summary";
import { InventoryTable } from "@/features/inventory/components/inventory-table";
import { MaterialInventoryTable } from "@/features/material-inventory/MaterialInventoryTable";
import { MaterialInventorySummary } from "@/features/material-inventory/MaterialInventorySummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type SortBy = "stock_asc" | "stock_desc" | "";

export default function Inventory() {
  const [, navigate] = useLocation();

  // ── Plants tab state ─────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [plantId, setPlantId] = useState<string>("");
  const [nurseryLocation, setNurseryLocation] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("");

  // ── Materials tab state ───────────────────────────────────────────────────
  const [matSearch, setMatSearch] = useState("");
  const [matCategory, setMatCategory] = useState<string>("");
  const [matLocation, setMatLocation] = useState<string>("");

  const queryClient = useQueryClient();

  // Plant inventory
  const { data: allItems = [] } = useListInventoryItems();

  const uniquePlants = useMemo(() => {
    const seen = new Map<number, InventoryItem["plant"]>();
    for (const item of allItems) {
      if (!seen.has(item.plantId)) seen.set(item.plantId, item.plant);
    }
    return Array.from(seen.entries())
      .map(([id, plant]) => ({ id, plant }))
      .sort((a, b) => a.plant.commonName.localeCompare(b.plant.commonName));
  }, [allItems]);

  const uniqueLocations = useMemo(
    () =>
      Array.from(new Set(allItems.map((i) => i.nurseryLocation)))
        .filter(Boolean)
        .sort(),
    [allItems],
  );

  const queryParams = useMemo(() => {
    const params: {
      search?: string;
      plantId?: number;
      nurseryLocation?: string;
      sortBy?: "stock_asc" | "stock_desc";
    } = {};
    if (search) params.search = search;
    if (plantId && plantId !== "all") params.plantId = Number(plantId);
    if (nurseryLocation && nurseryLocation !== "all") params.nurseryLocation = nurseryLocation;
    if (sortBy) params.sortBy = sortBy;
    return params;
  }, [search, plantId, nurseryLocation, sortBy]);

  const { data: filteredItems = [], isLoading: plantsLoading } = useListInventoryItems(queryParams);

  const hasPlantFilters =
    Boolean(search) ||
    (plantId !== "" && plantId !== "all") ||
    (nurseryLocation !== "" && nurseryLocation !== "all") ||
    Boolean(sortBy);

  const clearPlantFilters = () => {
    setSearch("");
    setPlantId("all");
    setNurseryLocation("all");
    setSortBy("");
    queryClient.invalidateQueries({ queryKey: getListInventoryItemsQueryKey() });
  };

  const cycleSortBy = () =>
    setSortBy((prev) =>
      prev === "" ? "stock_desc" : prev === "stock_desc" ? "stock_asc" : "",
    );

  const sortLabel =
    sortBy === "stock_desc" ? "Stock ↓" : sortBy === "stock_asc" ? "Stock ↑" : "Sort by Stock";

  // Material inventory
  const { data: allMatItems = [] } = useListMaterialInventory();

  const matQueryParams = useMemo(() => {
    const params: {
      search?: string;
      category?: string;
      stockLocation?: string;
    } = {};
    if (matSearch) params.search = matSearch;
    if (matCategory && matCategory !== "all") params.category = matCategory;
    if (matLocation && matLocation !== "all") params.stockLocation = matLocation;
    return params;
  }, [matSearch, matCategory, matLocation]);

  const { data: filteredMatItems = [], isLoading: matsLoading } = useListMaterialInventory(matQueryParams);

  const uniqueMatCategories = useMemo(
    () => Array.from(new Set(allMatItems.map((i) => i.material.category))).filter(Boolean).sort(),
    [allMatItems],
  );

  const uniqueMatLocations = useMemo(
    () => Array.from(new Set(allMatItems.map((i) => i.stockLocation))).filter(Boolean).sort(),
    [allMatItems],
  );

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-6 space-y-6 fade-in animate-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary font-serif">
          Inventory Control
        </h1>
        <p className="text-muted-foreground mt-1">
          Real-time stock levels for plants and materials across all locations.
        </p>
      </div>

      <Tabs defaultValue="plants">
        <TabsList>
          <TabsTrigger value="plants">Plants</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        {/* ── Plants Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="plants" className="space-y-6 mt-6">
          <InventorySummary items={allItems} />

          {/* Filters bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-card p-4 rounded-xl border shadow-sm">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by plant, code, or location…"
                className="pl-9 w-full bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 px-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Filter by:
                </span>
              </div>

              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-[170px]"
                value={plantId}
                onChange={(e) => setPlantId(e.target.value)}
              >
                <option value="all">All Plants</option>
                {uniquePlants.map(({ id, plant }) => (
                  <option key={id} value={id}>
                    {plant.plantCode} — {plant.commonName}
                  </option>
                ))}
              </select>

              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-[160px]"
                value={nurseryLocation}
                onChange={(e) => setNurseryLocation(e.target.value)}
              >
                <option value="all">All Locations</option>
                {uniqueLocations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              <Button
                variant={sortBy ? "secondary" : "outline"}
                size="sm"
                onClick={cycleSortBy}
                className="gap-1.5 h-10"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortLabel}
              </Button>

              {hasPlantFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearPlantFilters}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <InventoryTable
            items={filteredItems}
            isLoading={plantsLoading}
            onRowClick={(item) => navigate(`/inventory/${item.id}`)}
          />

          {!plantsLoading && filteredItems.length > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              Showing {filteredItems.length} of {allItems.length} inventory lines
            </p>
          )}
        </TabsContent>

        {/* ── Materials Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="materials" className="space-y-6 mt-6">
          <MaterialInventorySummary items={allMatItems} />

          {/* Materials filter bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-card p-4 rounded-xl border shadow-sm">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or location…"
                className="pl-9 w-full bg-background"
                value={matSearch}
                onChange={(e) => setMatSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 px-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Filter by:
                </span>
              </div>

              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-[170px]"
                value={matCategory}
                onChange={(e) => setMatCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {uniqueMatCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-[160px]"
                value={matLocation}
                onChange={(e) => setMatLocation(e.target.value)}
              >
                <option value="all">All Locations</option>
                {uniqueMatLocations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              {(matSearch || (matCategory && matCategory !== "all") || (matLocation && matLocation !== "all")) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMatSearch("");
                    setMatCategory("all");
                    setMatLocation("all");
                  }}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <MaterialInventoryTable items={filteredMatItems} isLoading={matsLoading} />

          {!matsLoading && filteredMatItems.length > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              Showing {filteredMatItems.length} of {allMatItems.length} material inventory lines
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
