import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import {
  ListPlantsQueryParams,
  CreatePlantBody,
  GetPlantParams,
  UpdatePlantParams,
  UpdatePlantBody,
  DeletePlantParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /plants — list with optional search + filter
router.get("/plants", async (req, res): Promise<void> => {
  const parsed = ListPlantsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, category, plantType, potSize } = parsed.data;

  const where: Record<string, unknown> = {};

  if (category) where["category"] = category;
  if (plantType) where["plantType"] = plantType;
  if (potSize) where["potSize"] = potSize;

  const plants = await prisma.plantMaster.findMany({
    where: search
      ? {
          ...where,
          OR: [
            { plantCode: { contains: search, mode: "insensitive" } },
            { botanicalName: { contains: search, mode: "insensitive" } },
            { commonName: { contains: search, mode: "insensitive" } },
          ],
        }
      : where,
    orderBy: { plantCode: "asc" },
  });

  res.json(plants);
});

// POST /plants — create
router.post("/plants", async (req, res): Promise<void> => {
  const parsed = CreatePlantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const plant = await prisma.plantMaster.create({ data: parsed.data });
    res.status(201).json(plant);
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) {
      res.status(409).json({ error: "Plant code already exists" });
      return;
    }
    throw err;
  }
});

// GET /plants/:id
router.get("/plants/:id", async (req, res): Promise<void> => {
  const params = GetPlantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const plant = await prisma.plantMaster.findUnique({
    where: { id: params.data.id },
  });

  if (!plant) {
    res.status(404).json({ error: "Plant not found" });
    return;
  }

  res.json(plant);
});

// PUT /plants/:id — full update
router.put("/plants/:id", async (req, res): Promise<void> => {
  const params = UpdatePlantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePlantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const plant = await prisma.plantMaster.update({
      where: { id: params.data.id },
      data: parsed.data,
    });
    res.json(plant);
  } catch (err: unknown) {
    if (isNotFoundError(err)) {
      res.status(404).json({ error: "Plant not found" });
      return;
    }
    if (isUniqueConstraintError(err)) {
      res.status(409).json({ error: "Plant code already exists" });
      return;
    }
    throw err;
  }
});

// DELETE /plants/:id
router.delete("/plants/:id", async (req, res): Promise<void> => {
  const params = DeletePlantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    await prisma.plantMaster.delete({ where: { id: params.data.id } });
    res.sendStatus(204);
  } catch (err: unknown) {
    if (isNotFoundError(err)) {
      res.status(404).json({ error: "Plant not found" });
      return;
    }
    throw err;
  }
});

// ── helpers ──────────────────────────────────────────────────────────────────

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}

function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2025"
  );
}

export default router;
