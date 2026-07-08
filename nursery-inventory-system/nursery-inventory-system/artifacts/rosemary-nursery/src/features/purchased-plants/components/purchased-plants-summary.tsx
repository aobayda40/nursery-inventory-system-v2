import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlantBatch } from '@workspace/api-client-react';
import { formatCurrency } from '../utils';
import { Package, Sprout, DollarSign, Layers } from 'lucide-react';

interface Props {
  batches: PlantBatch[];
}

export function PurchasedPlantsSummary({ batches }: Props) {
  const totalBatches = batches.length;
  const totalPlantsPurchased = batches.reduce((sum, b) => sum + b.quantityPurchased, 0);
  const totalSpend = batches.reduce((sum, b) => sum + b.totalBatchCost, 0);
  const totalCurrentStock = batches.reduce((sum, b) => sum + b.currentQuantity, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-serif">{totalBatches}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Plants Purchased</CardTitle>
          <Sprout className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-serif">{totalPlantsPurchased.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-serif text-primary">{formatCurrency(totalSpend)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Current Stock</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-serif">{totalCurrentStock.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
