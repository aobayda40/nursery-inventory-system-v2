import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import { ListAvailableBatchesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function toNum(v: { toString(): string } | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v.toString());
}

const plantSelect = {
  id: true,
  plantCode: true,
  commonName: true,
  botanicalName: true,
  potSize: true,
  imageUrl: true,
} as const;

// GET /available-batches
router.get("/available-batches", async (req, res): Promise<void> => {
  const parsed = ListAvailableBatchesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { plantId, nurseryLocation } = parsed.data;

  const [plantBatches, productionBatches] = await Promise.all([
    prisma.plantBatch.findMany({
      where: {
        currentQuantity: { gt: 0 },
        ...(plantId ? { plantId } : {}),
        ...(nurseryLocation ? { nurseryLocation } : {}),
      },
      include: { plant: { select: plantSelect } },
      orderBy: { purchaseDate: "asc" },
    }),
    prisma.productionBatch.findMany({
      where: {
        currentQuantity: { gt: 0 },
        ...(plantId ? { plantId } : {}),
        ...(nurseryLocation ? { nurseryLocation } : {}),
      },
      include: { plant: { select: plantSelect } },
      orderBy: { productionDate: "asc" },
    }),
  ]);

  const fromPurchase = plantBatches.map((b) => ({
    batchNumber: b.batchNumber,
    batchSource: "PURCHASE" as const,
    plantId: b.plantId,
    plant: b.plant,
    potSize: b.potSize,
    nurseryLocation: b.nurseryLocation,
    currentQuantity: b.currentQuantity,
    costPerPlant: toNum(b.costPerPlant),
  }));

  const fromProduction = productionBatches.map((b) => ({
    batchNumber: b.productionBatchNumber,
    batchSource: "PRODUCTION" as const,
    plantId: b.plantId,
    plant: b.plant,
    potSize: b.plant.potSize,
    nurseryLocation: b.nurseryLocation,
    currentQuantity: b.currentQuantity,
    costPerPlant: toNum(b.costPerPlant),
  }));

  res.json([...fromPurchase, ...fromProduction]);
});

export default router;
