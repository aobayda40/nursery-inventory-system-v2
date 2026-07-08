import { prisma } from "./prisma";

/**
 * Recalculate and upsert the MaterialInventory for a material/stockLocation combo.
 * Stock is the sum of all MaterialPurchase.currentQuantity at that location.
 */
export async function syncMaterialInventory(
  materialId: number,
  stockLocation: string,
): Promise<void> {
  const material = await prisma.materialMaster.findUnique({
    where: { id: materialId },
    select: { unit: true },
  });
  if (!material) return;

  const agg = await prisma.materialPurchase.aggregate({
    where: { materialId, stockLocation },
    _sum: { currentQuantity: true },
  });

  const stock = Number(agg._sum.currentQuantity ?? 0);

  await prisma.materialInventory.upsert({
    where: { materialId_stockLocation: { materialId, stockLocation } },
    create: {
      materialId,
      stockLocation,
      currentStock: stock,
      unit: material.unit,
    },
    update: { currentStock: stock },
  });
}
