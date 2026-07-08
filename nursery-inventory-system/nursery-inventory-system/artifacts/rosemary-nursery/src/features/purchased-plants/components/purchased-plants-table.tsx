import { format } from "date-fns";
import { PlantBatch } from '@workspace/api-client-react';
import { formatCurrency } from '../utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Props {
  batches: PlantBatch[];
  isLoading: boolean;
  onEdit: (batch: PlantBatch) => void;
  onDelete: (batch: PlantBatch) => void;
}

export function PurchasedPlantsTable({ batches, isLoading, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="whitespace-nowrap font-semibold">Batch No.</TableHead>
              <TableHead className="whitespace-nowrap font-semibold">Purchase Date</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Supplier</TableHead>
              <TableHead className="font-semibold min-w-[200px]">Plant</TableHead>
              <TableHead className="whitespace-nowrap font-semibold">Pot Size</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Qty Purchased</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Current Qty</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Total Cost</TableHead>
              <TableHead className="text-right whitespace-nowrap font-semibold">Cost/Plant</TableHead>
              <TableHead className="whitespace-nowrap font-semibold">Location</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <p className="font-medium text-foreground">No plant batches found.</p>
                    <p className="text-sm mt-1">Adjust your filters or add a new purchase.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              batches.map(batch => (
                <TableRow key={batch.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium text-foreground/80">{batch.batchNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(batch.purchaseDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{batch.supplier}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary">{batch.plant?.commonName}</span>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-muted/30 font-mono text-muted-foreground">
                        {batch.plant?.plantCode}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{batch.potSize}</TableCell>
                  <TableCell className="text-right font-medium">{batch.quantityPurchased.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={batch.currentQuantity > 0 ? "secondary" : "destructive"} className="font-mono shadow-none">
                      {batch.currentQuantity.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium font-mono text-[13px]">{formatCurrency(batch.totalBatchCost)}</TableCell>
                  <TableCell className="text-right text-muted-foreground font-mono text-[13px]">{formatCurrency(batch.costPerPlant)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-accent/50 px-2 py-1 text-xs font-medium text-accent-foreground ring-1 ring-inset ring-accent/20">
                      {batch.nurseryLocation}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => onEdit(batch)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit Batch</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(batch)} className="text-destructive focus:text-destructive cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Batch</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
