import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductionBatch } from '@workspace/api-client-react';
import { formatCurrency } from '../utils';
import { FlaskConical, Sprout, DollarSign, PercentCircle } from 'lucide-react';

interface Props {
  batches: ProductionBatch[];
}

export function ProductionSummary({ batches }: Props) {
  const totalBatches = batches.length;
  const totalSuccessful = batches.reduce((sum, b) => sum + b.successfulPlants, 0);
  const totalFailed = batches.reduce((sum, b) => sum + b.failedPlants, 0);
  const totalCost = batches.reduce((sum, b) => sum + b.totalProductionCost, 0);
  const totalAttempted = totalSuccessful + totalFailed;
  const successRate = totalAttempted > 0 ? (totalSuccessful / totalAttempted) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Production Batches</CardTitle>
          <FlaskConical className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-serif">{totalBatches}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Successful Plants</CardTitle>
          <Sprout className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-serif">{totalSuccessful.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Production Cost</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-serif text-primary">{formatCurrency(totalCost)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <PercentCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-serif">{successRate.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
}
