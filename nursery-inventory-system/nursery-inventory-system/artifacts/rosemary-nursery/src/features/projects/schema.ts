import * as z from "zod";

export const projectSchema = z.object({
  projectCode: z.string().optional(),
  projectName: z.string().min(1, "Project name is required").transform((v) => v.trim()).refine((v) => v.length > 0, "Project name is required"),
  clientName: z.string().min(1, "Client name is required").transform((v) => v.trim()).refine((v) => v.length > 0, "Client name is required"),
  projectLocation: z.string().min(1, "Project location is required").transform((v) => v.trim()).refine((v) => v.length > 0, "Project location is required"),
  status: z.enum(["Active", "Completed"]).default("Active"),
  notes: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const PROJECT_STATUSES = ["Active", "Completed"];
