import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import { syncInventoryForProduction } from "../lib/inventory";
import {
  ListProductionBatchesQueryParams,
  CreateProductionBatchBody,
  GetProductionBatchParams,
  UpdateProductionBatchParams,
  UpdateProductionBatchBody,
  DeleteProductionBatchParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const plantSelect = {
  id: true,
  plantCode: true,
  commonName: true,
  botanicalName: true,
  potSize: true,
  imageUrl: true,
} as const;

// ── helpers ──────────────────────────────────────────────────────────────────

function toNum(v: { toString(): string } | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v.toString());
}

function calcCosts(
  laborCost: number,
  potCost: number,
  soilCost: number,
  fertilizerCost: number,
  chemicalCost: number,
  waterCost: number,
  otherCosts: number,
  successfulPlants: number,
) {
  const total =
    laborCost + potCost + soilCost + fertilizerCost + chemicalCost + waterCost + otherCosts;
  const perPlant = successfulPlants > 0 ? total / successfulPlants : 0;
  return { totalProductionCost: total, costPerPlant: perPlant };
}

/** Generate a production batch number and retry up to 5 times on unique collision. */
async function generateBatchNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const agg = await prisma.productionBatch.aggregate({ _max: { id: true } });
  const nextSeq = (agg._max.id ?? 0) + 1;
  const seq = String(nextSeq).padStart(4, "0");
  return `PRB-${year}-${seq}`;
}

async function createBatchWithRetry(
  data: Parameters<typeof prisma.productionBatch.create>[0]["data"],
  attempts = 5,
) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await prisma.productionBatch.create({
        data,
        include: { plant: { select: plantSelect } },
      });
    } catch (err) {
      if (isUnique(err) && i < attempts - 1 && !data.productionBatchNumber) {
        data = { ...data, productionBatchNumber: await generateBatchNumber() };
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to generate unique production batch number after retries");
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2025"
  );
}

function isUnique(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}

function serialize(batch: {
  laborCost: unknown;
  potCost: unknown;
  soilCost: unknown;
  fertilizerCost: unknown;
  chemicalCost: unknown;
  waterCost: unknown;
  otherCosts: unknown;
  totalProductionCost: unknown;
  costPerPlant: unknown;
  productionDate: Date;
  [key: string]: unknown;
}) {
  return {
    ...batch,
    laborCost: toNum(batch.laborCost as never),
    potCost: toNum(batch.potCost as never),
    soilCost: toNum(batch.soilCost as never),
    fertilizerCost: toNum(batch.fertilizerCost as never),
    chemicalCost: toNum(batch.chemicalCost as never),
    waterCost: toNum(batch.waterCost as never),
    otherCosts: toNum(batch.otherCosts as never),
    totalProductionCost: toNum(batch.totalProductionCost as never),
    costPerPlant: toNum(batch.costPerPlant as never),
    productionDate: batch.productionDate.toISOString().slice(0, 10),
  };
}

// ── routes ───────────────────────────────────────────────────────────────────

// GET /production-batches
router.get("/production-batches", async (req, res): Promise<void> => {
  const parsed = ListProductionBatchesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, plantId, nurseryLocation, productionType } = parsed.data;

  const batches = await prisma.productionBatch.findMany({
    where: {
      ...(plantId ? { plantId } : {}),
      ...(nurseryLocation ? { nurseryLocation } : {}),
      ...(productionType
        ? { productionType: { contains: productionType, mode: "insensitive" } }
        : {}),
      ...(search
        ? {
            OR: [
              { productionBatchNumber: { contains: search, mode: "insensitive" } },
              { productionType: { contains: search, mode: "insensitive" } },
              { plant: { commonName: { contains: search, mode: "insensitive" } } },
              { plant: { botanicalName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { plant: { select: plantSelect } },
    orderBy: { productionDate: "desc" },
  });

  res.json(batches.map(serialize));
});

// POST /production-batches
router.post("/production-batches", async (req, res): Promise<void> => {
  const parsed = CreateProductionBatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    productionBatchNumber: rawBatchNumber,
    plantId,
    productionType,
    rootstockQuantity,
    successfulPlants,
    failedPlants = 0,
    laborCost = 0,
    potCost = 0,
    soilCost = 0,
    fertilizerCost = 0,
    chemicalCost = 0,
    waterCost = 0,
    otherCosts = 0,
    productionDate,
    nurseryLocation,
  } = parsed.data;

  const providedBatchNumber = rawBatchNumber?.trim();
  const productionBatchNumber = providedBatchNumber || (await generateBatchNumber());
  const { totalProductionCost, costPerPlant } = calcCosts(
    laborCost,
    potCost,
    soilCost,
    fertilizerCost,
    chemicalCost,
    waterCost,
    otherCosts,
    successfulPlants,
  );

  const batchData = {
    productionBatchNumber,
    plantId,
    productionType,
    rootstockQuantity,
    successfulPlants,
    failedPlants,
    laborCost,
    potCost,
    soilCost,
    fertilizerCost,
    chemicalCost,
    waterCost,
    otherCosts,
    totalProductionCost,
    costPerPlant,
    currentQuantity: successfulPlants,
    productionDate: new Date(productionDate),
    nurseryLocation,
  };

  try {
    const batch = providedBatchNumber
      ? await prisma.productionBatch.create({
          data: batchData,
          include: { plant: { select: plantSelect } },
        })
      : await createBatchWithRetry(batchData);

    await syncInventoryForProduction(plantId, nurseryLocation);

    res.status(201).json(serialize(batch));
  } catch (err) {
    if (isUnique(err)) {
      res.status(409).json({ error: "Production batch number already exists" });
      return;
    }
    throw err;
  }
});

// GET /production-batches/:id
router.get("/production-batches/:id", async (req, res): Promise<void> => {
  const params = GetProductionBatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const batch = await prisma.productionBatch.findUnique({
    where: { id: params.data.id },
    include: { plant: { select: plantSelect } },
  });

  if (!batch) {
    res.status(404).json({ error: "Production batch not found" });
    return;
  }

  res.json(serialize(batch));
});

// PUT /production-batches/:id
router.put("/production-batches/:id", async (req, res): Promise<void> => {
  const params = UpdateProductionBatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductionBatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await prisma.productionBatch.findUnique({
    where: { id: params.data.id },
  });
  if (!existing) {
    res.status(404).json({ error: "Production batch not found" });
    return;
  }

  const {
    productionBatchNumber,
    plantId,
    productionType,
    rootstockQuantity,
    successfulPlants,
    failedPlants,
    laborCost,
    potCost,
    soilCost,
    fertilizerCost,
    chemicalCost,
    waterCost,
    otherCosts,
    productionDate,
    nurseryLocation,
  } = parsed.data;

  const newSuccessful = successfulPlants ?? existing.successfulPlants;
  const successfulDelta = newSuccessful - existing.successfulPlants;
  const newCurrentQuantity = Math.max(0, existing.currentQuantity + successfulDelta);
  const newLabor = laborCost ?? toNum(existing.laborCost);
  const newPot = potCost ?? toNum(existing.potCost);
  const newSoil = soilCost ?? toNum(existing.soilCost);
  const newFertilizer = fertilizerCost ?? toNum(existing.fertilizerCost);
  const newChemical = chemicalCost ?? toNum(existing.chemicalCost);
  const newWater = waterCost ?? toNum(existing.waterCost);
  const newOther = otherCosts ?? toNum(existing.otherCosts);

  const { totalProductionCost, costPerPlant } = calcCosts(
    newLabor,
    newPot,
    newSoil,
    newFertilizer,
    newChemical,
    newWater,
    newOther,
    newSuccessful,
  );

  try {
    const batch = await prisma.productionBatch.update({
      where: { id: params.data.id },
      data: {
        ...(productionBatchNumber !== undefined ? { productionBatchNumber } : {}),
        ...(plantId !== undefined ? { plantId } : {}),
        ...(productionType !== undefined ? { productionType } : {}),
        ...(rootstockQuantity !== undefined ? { rootstockQuantity } : {}),
        ...(successfulPlants !== undefined ? { successfulPlants } : {}),
        ...(failedPlants !== undefined ? { failedPlants } : {}),
        ...(laborCost !== undefined ? { laborCost } : {}),
        ...(potCost !== undefined ? { potCost } : {}),
        ...(soilCost !== undefined ? { soilCost } : {}),
        ...(fertilizerCost !== undefined ? { fertilizerCost } : {}),
        ...(chemicalCost !== undefined ? { chemicalCost } : {}),
        ...(waterCost !== undefined ? { waterCost } : {}),
        ...(otherCosts !== undefined ? { otherCosts } : {}),
        ...(productionDate !== undefined ? { productionDate: new Date(productionDate) } : {}),
        ...(nurseryLocation !== undefined ? { nurseryLocation } : {}),
        totalProductionCost,
        costPerPlant,
        ...(successfulPlants !== undefined ? { currentQuantity: newCurrentQuantity } : {}),
      },
      include: { plant: { select: plantSelect } },
    });

    const oldPlantId = existing.plantId;
    const oldLocation = existing.nurseryLocation;
    const newPlantId = plantId ?? oldPlantId;
    const newLocation = nurseryLocation ?? oldLocation;

    await syncInventoryForProduction(oldPlantId, oldLocation);
    if (newPlantId !== oldPlantId || newLocation !== oldLocation) {
      await syncInventoryForProduction(newPlantId, newLocation);
    }

    res.json(serialize(batch));
  } catch (err) {
    if (isNotFound(err)) {
      res.status(404).json({ error: "Production batch not found" });
      return;
    }
    if (isUnique(err)) {
      res.status(409).json({ error: "Production batch number already exists" });
      return;
    }
    throw err;
  }
});

// DELETE /production-batches/:id
router.delete("/production-batches/:id", async (req, res): Promise<void> => {
  const params = DeleteProductionBatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await prisma.productionBatch.findUnique({
    where: { id: params.data.id },
  });
  if (!existing) {
    res.status(404).json({ error: "Production batch not found" });
    return;
  }

  try {
    await prisma.productionBatch.delete({ where: { id: params.data.id } });
    await syncInventoryForProduction(existing.plantId, existing.nurseryLocation);
    res.sendStatus(204);
  } catch (err) {
    if (isNotFound(err)) {
      res.status(404).json({ error: "Production batch not found" });
      return;
    }
    throw err;
  }
});

export default router;
