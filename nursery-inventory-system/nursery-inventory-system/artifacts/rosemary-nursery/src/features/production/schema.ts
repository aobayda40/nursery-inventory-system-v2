import { z } from "zod";

export const productionBatchSchema = z.object({
  productionBatchNumber: z.string().optional(),
  plantId: z.coerce.number().min(1, "Plant is required"),
  productionType: z.string().trim().min(1, "Production type is required"),
  rootstockQuantity: z.coerce.number().min(1, "Must be at least 1"),
  successfulPlants: z.coerce.number().min(0, "Must be >= 0"),
  failedPlants: z.coerce.number().min(0).default(0),
  laborCost: z.coerce.number().min(0).default(0),
  potCost: z.coerce.number().min(0).default(0),
  soilCost: z.coerce.number().min(0).default(0),
  fertilizerCost: z.coerce.number().min(0).default(0),
  chemicalCost: z.coerce.number().min(0).default(0),
  waterCost: z.coerce.number().min(0).default(0),
  otherCosts: z.coerce.number().min(0).default(0),
  productionDate: z.string().min(1, "Production date is required"),
  nurseryLocation: z.string().trim().min(1, "Location is required"),
});

export type ProductionBatchFormValues = z.infer<typeof productionBatchSchema>;
