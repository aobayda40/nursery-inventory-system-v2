import { prisma } from "./prisma";

/**
 * Recalculate and upsert the InventoryItem for a plant/potSize/location combo.
 * Stock is the sum of purchased plant batch quantities (matching potSize) plus
 * successful plants from production batches (which always target the plant's
 * master pot size).
 */
export async function syncInventory(
  plantId: number,
  potSize: string,
  nurseryLocation: string,
): Promise<void> {
  const plant = await prisma.plantMaster.findUnique({
    where: { id: plantId },
    select: { potSize: true },
  });

  const [batchAgg, prodAgg] = await Promise.all([
    prisma.plantBatch.aggregate({
      where: { plantId, potSize, nurseryLocation },
      _sum: { currentQuantity: true },
    }),
    plant && plant.potSize === potSize
      ? prisma.productionBatch.aggregate({
          where: { plantId, nurseryLocation },
          _sum: { currentQuantity: true },
        })
      : Promise.resolve({ _sum: { currentQuantity: 0 } }),
  ]);

  const stock =
    (batchAgg._sum.currentQuantity ?? 0) + (prodAgg._sum.currentQuantity ?? 0);

  await prisma.inventoryItem.upsert({
    where: { plantId_potSize_nurseryLocation: { plantId, potSize, nurseryLocation } },
    create: { plantId, potSize, nurseryLocation, currentStock: stock },
    update: { currentStock: stock },
  });
}

/** Sync inventory for a production batch's plant, using the plant's master pot size. */
export async function syncInventoryForProduction(
  plantId: number,
  nurseryLocation: string,
): Promise<void> {
  const plant = await prisma.plantMaster.findUnique({
    where: { id: plantId },
    select: { potSize: true },
  });
  if (!plant) return;
  await syncInventory(plantId, plant.potSize, nurseryLocation);
}
