import * as z from "zod";

export const issueLineSchema = z.object({
  plantId: z.coerce.number().min(1, "Select a plant"),
  batchKey: z.string().min(1, "Select a batch"),
  issueQuantity: z.coerce.number().min(1, "Qty must be at least 1"),
});

export const materialIssueLineSchema = z.object({
  materialId: z.coerce.number().min(1, "Select a material"),
  purchaseKey: z.string().min(1, "Select a purchase lot"),
  issueQuantity: z.coerce.number().positive("Qty must be positive"),
});

export const plantIssueSchema = z.object({
  issueDate: z.string().min(1, "Issue date is required"),
  projectId: z.coerce.number().min(1, "Select a project"),
  requestedBy: z.string().min(1, "Requested by is required"),
  issuedBy: z.string().min(1, "Issued by is required"),
  remarks: z.string().optional(),
  lines: z.array(issueLineSchema).min(1, "Add at least one plant line item"),
  materialLines: z.array(materialIssueLineSchema),
});

export type IssueLineValues = z.infer<typeof issueLineSchema>;
export type MaterialIssueLineValues = z.infer<typeof materialIssueLineSchema>;
export type PlantIssueFormValues = z.infer<typeof plantIssueSchema>;

export const makeBatchKey = (batchNumber: string, batchSource: string) => `${batchSource}::${batchNumber}`;
export const parseBatchKey = (key: string) => {
  const [batchSource, ...rest] = key.split("::");
  return { batchSource: batchSource as "PURCHASE" | "PRODUCTION", batchNumber: rest.join("::") };
};

export const makePurchaseKey = (purchaseNumber: string, stockLocation: string) =>
  `${stockLocation}::${purchaseNumber}`;
export const parsePurchaseKey = (key: string) => {
  const [stockLocation, ...rest] = key.split("::");
  return { stockLocation, purchaseNumber: rest.join("::") };
};
