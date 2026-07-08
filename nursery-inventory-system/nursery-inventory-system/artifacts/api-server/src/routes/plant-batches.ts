import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import { syncInventory } from "../lib/inventory";
import {
  ListPlantBatchesQueryParams,
  CreatePlantBatchBody,
  GetPlantBatchParams,
  UpdatePlantBatchParams,
  UpdatePlantBatchBody,
  DeletePlantBatchParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ── helpers ──────────────────────────────────────────────────────────────────

function toNum(v: { toString(): string } | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v.toString());
}

/**
 * Calculate totalBatchCost and costPerPlant from raw inputs.
 *   totalBatchCost = (quantityPurchased × purchasePricePerPlant) + transportationCost + otherCosts
 *   costPerPlant   = totalBatchCost / quantityPurchased
 *
 * All params are coerced with Number() as a defence against accidental string
 * values reaching this function (e.g. from raw JSON bodies before Zod parses them).
 */
export function calcCosts(
  qty: number,
  pricePerPlant: number,
  transport: number,
  other: number,
) {
  const q = Number(qty);
  const p = Number(pricePerPlant);
  const t = Number(transport);
  const o = Number(other);
  const total = q * p + t + o;
  const perPlant = q > 0 ? total / q : 0;
  return { totalBatchCost: total, costPerPlant: perPlant };
}

/** Generate a batch number and retry up to 5 times on unique collision. */
async function generateBatchNumber(): Promise<string> {
  const year = new Date().getFullYear();
  // Use MAX(id) instead of count() so that gaps from deletes don't collide
  const agg = await prisma.plantBatch.aggregate({ _max: { id: true } });
  const nextSeq = (agg._max.id ?? 0) + 1;
  const seq = String(nextSeq).padStart(4, "0");
  return `PB-${year}-${seq}`;
}

/** Attempt to create a batch, retrying with a fresh batch number on P2002. */
async function createBatchWithRetry(
  data: Parameters<typeof prisma.plantBatch.create>[0]["data"],
  attempts = 5,
) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await prisma.plantBatch.create({
        data,
        include: {
          plant: {
            select: {
              id: true, plantCode: true, commonName: true,
              botanicalName: true, potSize: true, imageUrl: true,
            },
          },
        },
      });
    } catch (err) {
      // Only retry auto-generated numbers; if caller provided one, surface the conflict
      if (isUnique(err) && i < attempts - 1 && !data.batchNumber) {
        data = { ...data, batchNumber: await generateBatchNumber() };
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to generate unique batch number after retries");
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

// ── routes ───────────────────────────────────────────────────────────────────

// GET /plant-batches
router.get("/plant-batches", async (req, res): Promise<void> => {
  const parsed = ListPlantBatchesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, plantId, nurseryLocation, supplier } = parsed.data;

  const batches = await prisma.plantBatch.findMany({
    where: {
      ...(plantId ? { plantId } : {}),
      ...(nurseryLocation ? { nurseryLocation } : {}),
      ...(supplier ? { supplier: { contains: supplier, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { batchNumber: { contains: search, mode: "insensitive" } },
              { supplier: { contains: search, mode: "insensitive" } },
              { plant: { commonName: { contains: search, mode: "insensitive" } } },
              { plant: { botanicalName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      plant: {
        select: {
          id: true,
          plantCode: true,
          commonName: true,
          botanicalName: true,
          potSize: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { purchaseDate: "desc" },
  });

  res.json(
    batches.map((b) => ({
      ...b,
      purchasePricePerPlant: toNum(b.purchasePricePerPlant),
      transportationCost: toNum(b.transportationCost),
      otherCosts: toNum(b.otherCosts),
      totalBatchCost: toNum(b.totalBatchCost),
      costPerPlant: toNum(b.costPerPlant),
      purchaseDate: b.purchaseDate.toISOString().slice(0, 10),
    })),
  );
});

// POST /plant-batches
router.post("/plant-batches", async (req, res): Promise<void> => {
  const parsed = CreatePlantBatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    batchNumber: rawBatchNumber,
    supplier,
    plantId,
    potSize,
    quantityPurchased,
    purchasePricePerPlant,
    transportationCost = 0,
    otherCosts = 0,
    purchaseDate,
    nurseryLocation,
  } = parsed.data;

  const providedBatchNumber = rawBatchNumber?.trim();
  const batchNumber = providedBatchNumber || (await generateBatchNumber());
  const { totalBatchCost, costPerPlant } = calcCosts(
    quantityPurchased,
    purchasePricePerPlant,
    transportationCost,
    otherCosts,
  );

  const batchData = {
    batchNumber,
    supplier,
    plantId,
    potSize,
    quantityPurchased,
    purchasePricePerPlant,
    transportationCost,
    otherCosts,
    totalBatchCost,
    costPerPlant,
    purchaseDate: new Date(purchaseDate),
    currentQuantity: quantityPurchased,
    nurseryLocation,
  };

  try {
    // If caller provided a batch number, create once. Otherwise use retry loop.
    const batch = providedBatchNumber
      ? await prisma.plantBatch.create({
          data: batchData,
          include: {
            plant: {
              select: {
                id: true, plantCode: true, commonName: true,
                botanicalName: true, potSize: true, imageUrl: true,
              },
            },
          },
        })
      : await createBatchWithRetry(batchData);

    await syncInventory(plantId, potSize, nurseryLocation);

    res.status(201).json({
      ...batch,
      purchasePricePerPlant: toNum(batch.purchasePricePerPlant),
      transportationCost: toNum(batch.transportationCost),
      otherCosts: toNum(batch.otherCosts),
      totalBatchCost: toNum(batch.totalBatchCost),
      costPerPlant: toNum(batch.costPerPlant),
      purchaseDate: batch.purchaseDate.toISOString().slice(0, 10),
    });
  } catch (err) {
    if (isUnique(err)) {
      res.status(409).json({ error: "Batch number already exists" });
      return;
    }
    throw err;
  }
});

// GET /plant-batches/:id
router.get("/plant-batches/:id", async (req, res): Promise<void> => {
  const params = GetPlantBatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const batch = await prisma.plantBatch.findUnique({
    where: { id: params.data.id },
    include: {
      plant: {
        select: {
          id: true, plantCode: true, commonName: true,
          botanicalName: true, potSize: true, imageUrl: true,
        },
      },
    },
  });

  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }

  res.json({
    ...batch,
    purchasePricePerPlant: toNum(batch.purchasePricePerPlant),
    transportationCost: toNum(batch.transportationCost),
    otherCosts: toNum(batch.otherCosts),
    totalBatchCost: toNum(batch.totalBatchCost),
    costPerPlant: toNum(batch.costPerPlant),
    purchaseDate: batch.purchaseDate.toISOString().slice(0, 10),
  });
});

// PUT /plant-batches/:id
router.put("/plant-batches/:id", async (req, res): Promise<void> => {
  const params = UpdatePlantBatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePlantBatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Fetch the existing batch first so we can do inventory delta calculations
  const existing = await prisma.plantBatch.findUnique({
    where: { id: params.data.id },
  });
  if (!existing) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }

  const {
    batchNumber,
    supplier,
    plantId,
    potSize,
    quantityPurchased,
    purchasePricePerPlant,
    transportationCost,
    otherCosts,
    purchaseDate,
    currentQuantity,
    nurseryLocation,
  } = parsed.data;

  // Merge with existing values for recalculation
  const newQty = quantityPurchased ?? existing.quantityPurchased;
  const newPrice = purchasePricePerPlant ?? toNum(existing.purchasePricePerPlant);
  const newTransport = transportationCost ?? toNum(existing.transportationCost);
  const newOther = otherCosts ?? toNum(existing.otherCosts);

  const { totalBatchCost, costPerPlant } = calcCosts(newQty, newPrice, newTransport, newOther);

  try {
    const batch = await prisma.plantBatch.update({
      where: { id: params.data.id },
      data: {
        ...(batchNumber !== undefined ? { batchNumber } : {}),
        ...(supplier !== undefined ? { supplier } : {}),
        ...(plantId !== undefined ? { plantId } : {}),
        ...(potSize !== undefined ? { potSize } : {}),
        ...(quantityPurchased !== undefined ? { quantityPurchased } : {}),
        ...(purchasePricePerPlant !== undefined ? { purchasePricePerPlant } : {}),
        ...(transportationCost !== undefined ? { transportationCost } : {}),
        ...(otherCosts !== undefined ? { otherCosts } : {}),
        ...(purchaseDate !== undefined ? { purchaseDate: new Date(purchaseDate) } : {}),
        ...(currentQuantity !== undefined ? { currentQuantity } : {}),
        ...(nurseryLocation !== undefined ? { nurseryLocation } : {}),
        totalBatchCost,
        costPerPlant,
      },
      include: {
        plant: {
          select: {
            id: true, plantCode: true, commonName: true,
            botanicalName: true, potSize: true, imageUrl: true,
          },
        },
      },
    });

    // Re-sync inventory for old and new location/plant if they changed
    const oldPlantId = existing.plantId;
    const oldPotSize = existing.potSize;
    const oldLocation = existing.nurseryLocation;
    const newPlantId = plantId ?? oldPlantId;
    const newPotSize = potSize ?? oldPotSize;
    const newLocation = nurseryLocation ?? oldLocation;

    await syncInventory(oldPlantId, oldPotSize, oldLocation);
    if (newPlantId !== oldPlantId || newPotSize !== oldPotSize || newLocation !== oldLocation) {
      await syncInventory(newPlantId, newPotSize, newLocation);
    }

    res.json({
      ...batch,
      purchasePricePerPlant: toNum(batch.purchasePricePerPlant),
      transportationCost: toNum(batch.transportationCost),
      otherCosts: toNum(batch.otherCosts),
      totalBatchCost: toNum(batch.totalBatchCost),
      costPerPlant: toNum(batch.costPerPlant),
      purchaseDate: batch.purchaseDate.toISOString().slice(0, 10),
    });
  } catch (err) {
    if (isNotFound(err)) {
      res.status(404).json({ error: "Batch not found" });
      return;
    }
    if (isUnique(err)) {
      res.status(409).json({ error: "Batch number already exists" });
      return;
    }
    throw err;
  }
});

// DELETE /plant-batches/:id
router.delete("/plant-batches/:id", async (req, res): Promise<void> => {
  const params = DeletePlantBatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await prisma.plantBatch.findUnique({
    where: { id: params.data.id },
  });
  if (!existing) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }

  try {
    await prisma.plantBatch.delete({ where: { id: params.data.id } });
    await syncInventory(existing.plantId, existing.potSize, existing.nurseryLocation);
    res.sendStatus(204);
  } catch (err) {
    if (isNotFound(err)) {
      res.status(404).json({ error: "Batch not found" });
      return;
    }
    throw err;
  }
});

export default router;
