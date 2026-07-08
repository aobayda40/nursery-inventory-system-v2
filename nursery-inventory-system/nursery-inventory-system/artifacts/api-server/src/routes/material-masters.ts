import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const router: IRouter = Router();

const MATERIAL_CATEGORIES = [
  "Pots",
  "Soil Mix",
  "Fertilizer",
  "Chemicals",
  "Cocopeat",
  "Peat Moss",
  "Compost",
  "Perlite",
  "Vermiculite",
  "Others",
] as const;

const ListQueryParams = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
});

const CreateBody = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  description: z.string().optional(),
});

const UpdateBody = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

const IdParam = z.object({ id: z.coerce.number().int().positive() });

/** Auto-generate a material code: MAT-YYYY-NNNN */
async function generateMaterialCode(): Promise<string> {
  const year = new Date().getFullYear();
  const agg = await prisma.materialMaster.aggregate({ _max: { id: true } });
  const nextSeq = (agg._max.id ?? 0) + 1;
  const seq = String(nextSeq).padStart(4, "0");
  return `MAT-${year}-${seq}`;
}

// GET /material-masters
router.get("/material-masters", async (req, res): Promise<void> => {
  const parsed = ListQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, category } = parsed.data;

  const items = await prisma.materialMaster.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { materialCode: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  res.json(items);
});

// POST /material-masters
router.post("/material-masters", async (req, res): Promise<void> => {
  const parsed = CreateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, category, unit, description } = parsed.data;
  const materialCode = await generateMaterialCode();

  const created = await prisma.materialMaster.create({
    data: { materialCode, name, category, unit, description },
  });

  res.status(201).json(created);
});

// GET /material-masters/categories
router.get("/material-masters/categories", async (_req, res): Promise<void> => {
  res.json(MATERIAL_CATEGORIES);
});

// GET /material-masters/:id
router.get("/material-masters/:id", async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const item = await prisma.materialMaster.findUnique({
    where: { id: params.data.id },
  });
  if (!item) {
    res.status(404).json({ error: "Material not found" });
    return;
  }

  res.json(item);
});

// PUT /material-masters/:id
router.put("/material-masters/:id", async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await prisma.materialMaster.findUnique({
    where: { id: params.data.id },
  });
  if (!existing) {
    res.status(404).json({ error: "Material not found" });
    return;
  }

  const updated = await prisma.materialMaster.update({
    where: { id: params.data.id },
    data: parsed.data,
  });

  res.json(updated);
});

// DELETE /material-masters/:id
router.delete("/material-masters/:id", async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await prisma.materialMaster.findUnique({
    where: { id: params.data.id },
    include: { purchases: { take: 1 }, issueLines: { take: 1 } },
  });
  if (!existing) {
    res.status(404).json({ error: "Material not found" });
    return;
  }

  if (existing.purchases.length > 0 || existing.issueLines.length > 0) {
    res.status(409).json({
      error: "Material has purchase or issue history and cannot be deleted",
    });
    return;
  }

  await prisma.materialMaster.delete({ where: { id: params.data.id } });
  res.status(204).end();
});

export default router;
