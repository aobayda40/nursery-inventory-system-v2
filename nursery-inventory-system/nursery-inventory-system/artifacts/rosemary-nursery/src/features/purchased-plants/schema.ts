import { z } from "zod";

export const plantBatchSchema = z.object({
  batchNumber: z.string().optional(),
  supplier: z.string().trim().min(1, "Supplier is required"),
  plantId: z.coerce.number().min(1, "Plant is required"),
  potSize: z.string().trim().min(1, "Pot size is required"),
  quantityPurchased: z.coerce.number().min(1, "Must be at least 1"),
  purchasePricePerPlant: z.coerce.number().min(0, "Must be >= 0"),
  transportationCost: z.coerce.number().min(0).default(0),
  otherCosts: z.coerce.number().min(0).default(0),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  currentQuantity: z.coerce.number().min(0).optional(),
  nurseryLocation: z.string().trim().min(1, "Location is required"),
});

export type PlantBatchFormValues = z.infer<typeof plantBatchSchema>;
