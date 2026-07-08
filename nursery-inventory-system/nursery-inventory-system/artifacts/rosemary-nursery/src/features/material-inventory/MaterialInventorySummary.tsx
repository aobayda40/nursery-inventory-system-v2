import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes, AlertTriangle, TrendingUp, Layers } from "lucide-react";
import { MaterialInventoryItem } from "@workspace/api-client-react";

interface Props {
  items: MaterialInventoryItem[];
}

export function MaterialInventorySummary({ items }: Props) {
  const totalMaterialTypes = items.length;
  const totalInventoryValue = items.reduce((sum, i) => sum + i.inventoryValue, 0);
  const outOfStock = items.filter((i) => i.currentStock === 0).length;
  const lowStock = items.filter((i) => i.currentStock > 0 && i.currentStock <= 10).length;

  const cards = [
    {
      title: "Material Types",
      value: totalMaterialTypes.toString(),
      icon: Layers,
      desc: "Unique material lines",
    },
    {
      title: "Inventory Value",
      value: totalInventoryValue.toLocaleString(undefined, {
        style: "currency",
        currency: "SAR",
        maximumFractionDigits: 0,
      }),
      icon: TrendingUp,
      desc: "Weighted-average cost basis",
    },
    {
      title: "Stock Alerts",
      value: (outOfStock + lowStock).toString(),
      icon: AlertTriangle,
      desc: `${outOfStock} out of stock · ${lowStock} low stock`,
      highlight: outOfStock + lowStock > 0,
    },
    {
      title: "Locations",
      value: String(new Set(items.map((i) => i.stockLocation)).size),
      icon: Boxes,
      desc: "Distinct stock locations",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className={card.highlight ? "border-amber-300" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon
              className={`h-4 w-4 ${card.highlight ? "text-amber-500" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
