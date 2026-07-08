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
  search: z.string().optional(),
  materialId: z.coerce.number().int().optional(),
  stockLocation: z.string().optional(),
  category: z.string().optional(),
});

// GET /material-inventory
router.get("/material-inventory", async (req, res): Promise<void> => {
  const parsed = ListQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, materialId, stockLocation, category } = parsed.data;

  const items = await prisma.materialInventory.findMany({
    where: {
      ...(materialId ? { materialId } : {}),
      ...(stockLocation ? { stockLocation } : {}),
      ...(category ? { material: { category } } : {}),
      ...(search
        ? {
            OR: [
              { material: { name: { contains: search, mode: "insensitive" } } },
              { material: { materialCode: { contains: search, mode: "insensitive" } } },
              { material: { category: { contains: search, mode: "insensitive" } } },
              { stockLocation: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { material: { select: materialSelect } },
    orderBy: { updatedAt: "desc" },
  });

  // Compute average unit cost from current purchase stock
  const allPurchases = await prisma.materialPurchase.findMany({
    select: { materialId: true, stockLocation: true, currentQuantity: true, unitCost: true },
    where: { currentQuantity: { gt: 0 } },
  });

  const costMap = new Map<string, { totalQtyCost: number; totalQty: number }>();
  for (const p of allPurchases) {
    const key = `${p.materialId}:${p.stockLocation}`;
    const e = costMap.get(key) ?? { totalQtyCost: 0, totalQty: 0 };
    const qty = toNum(p.currentQuantity);
    const cost = toNum(p.unitCost);
    e.totalQtyCost += qty * cost;
    e.totalQty += qty;
    costMap.set(key, e);
  }

  const result = items.map((item) => {
    const costData = costMap.get(`${item.materialId}:${item.stockLocation}`);
    const avgUnitCost = costData && costData.totalQty > 0 ? costData.totalQtyCost / costData.totalQty : 0;
    const currentStock = toNum(item.currentStock);
    return {
      id: item.id,
      materialId: item.materialId,
      material: item.material,
      stockLocation: item.stockLocation,
      currentStock,
      unit: item.unit,
      avgUnitCost,
      inventoryValue: currentStock * avgUnitCost,
      updatedAt: item.updatedAt,
    };
  });

  res.json(result);
});

// GET /material-inventory/:id
router.get("/material-inventory/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const item = await prisma.materialInventory.findUnique({
    where: { id },
    include: { material: { select: materialSelect } },
  });

  if (!item) {
    res.status(404).json({ error: "Material inventory item not found" });
    return;
  }

  const purchases = await prisma.materialPurchase.findMany({
    where: { materialId: item.materialId, stockLocation: item.stockLocation },
    orderBy: { purchaseDate: "desc" },
  });

  let totalQtyCost = 0;
  let totalQty = 0;
  for (const p of purchases) {
    const qty = toNum(p.currentQuantity);
    totalQtyCost += qty * toNum(p.unitCost);
    totalQty += qty;
  }
  const avgUnitCost = totalQty > 0 ? totalQtyCost / totalQty : 0;
  const currentStock = toNum(item.currentStock);

  res.json({
    id: item.id,
    materialId: item.materialId,
    material: item.material,
    stockLocation: item.stockLocation,
    currentStock,
    unit: item.unit,
    avgUnitCost,
    inventoryValue: currentStock * avgUnitCost,
    updatedAt: item.updatedAt,
    purchases: purchases.map((p) => ({
      purchaseNumber: p.purchaseNumber,
      supplier: p.supplier,
      purchaseDate: p.purchaseDate.toISOString().slice(0, 10),
      quantity: toNum(p.quantity),
      currentQuantity: toNum(p.currentQuantity),
      issuedQuantity: toNum(p.quantity) - toNum(p.currentQuantity),
      unitCost: toNum(p.unitCost),
      totalCost: toNum(p.totalCost),
      unit: p.unit,
    })),
  });
});

// GET /material-inventory/:id/movements
const MovementsQueryParams = z.object({
  type: z.string().optional(),
  dateFrom: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(new Date(v).getTime()), {
      message: "dateFrom must be a valid ISO date",
    }),
  dateTo: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(new Date(v).getTime()), {
      message: "dateTo must be a valid ISO date",
    }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

router.get("/material-inventory/:id/movements", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const item = await prisma.materialInventory.findUnique({ where: { id } });
  if (!item) {
    res.status(404).json({ error: "Material inventory item not found" });
    return;
  }

  const parsed = MovementsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, dateFrom, dateTo, page, pageSize } = parsed.data;

  const where = {
    materialId: item.materialId,
    stockLocation: item.stockLocation,
    ...(type ? { movementType: type } : {}),
    ...((dateFrom || dateTo)
      ? {
          movementDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
  };

  const [total, movements] = await Promise.all([
    prisma.materialMovement.count({ where }),
    prisma.materialMovement.findMany({
      where,
      include: {
        plantIssue: {
          select: {
            issueNumber: true,
            project: { select: { projectCode: true, projectName: true } },
          },
        },
      },
      orderBy: [{ movementDate: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  res.json({
    data: movements.map((m) => ({
      id: m.id,
      movementType: m.movementType,
      purchaseNumber: m.purchaseNumber,
      quantity: toNum(m.quantity),
      unitCost: toNum(m.unitCost),
      totalCost: toNum(m.totalCost),
      movementDate: m.movementDate.toISOString().slice(0, 10),
      plantIssueId: m.plantIssueId ?? null,
      plantIssue: m.plantIssue
        ? {
            issueNumber: m.plantIssue.issueNumber,
            projectCode: m.plantIssue.project.projectCode,
            projectName: m.plantIssue.project.projectName,
          }
        : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

export default router;
