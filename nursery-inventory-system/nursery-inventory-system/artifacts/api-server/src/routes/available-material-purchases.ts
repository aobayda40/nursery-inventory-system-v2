import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const router: IRouter = Router();

function toNum(v: { toString(): string } | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v.toString());
}

const materialSelect = {
  id: true,
  materialCode: true,
  name: true,
  category: true,
  unit: true,
} as const;

const ListQueryParams = z.object({
  materialId: z.coerce.number().int().optional(),
  stockLocation: z.string().optional(),
});

// GET /available-material-purchases
router.get("/available-material-purchases", async (req, res): Promise<void> => {
  const parsed = ListQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { materialId, stockLocation } = parsed.data;

  const purchases = await prisma.materialPurchase.findMany({
    where: {
      currentQuantity: { gt: 0 },
      ...(materialId ? { materialId } : {}),
      ...(stockLocation ? { stockLocation } : {}),
    },
    include: { material: { select: materialSelect } },
    orderBy: { purchaseDate: "asc" },
  });

  res.json(
    purchases.map((p) => ({
      purchaseNumber: p.purchaseNumber,
      materialId: p.materialId,
      material: p.material,
      supplier: p.supplier,
      stockLocation: p.stockLocation,
      unit: p.unit,
      currentQuantity: toNum(p.currentQuantity),
      unitCost: toNum(p.unitCost),
    })),
  );
});

export default router;
