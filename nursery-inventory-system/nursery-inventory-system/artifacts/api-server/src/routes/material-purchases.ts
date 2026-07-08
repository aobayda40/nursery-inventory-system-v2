import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import { syncMaterialInventory } from "../lib/material-inventory";
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
  supplier: z.string().optional(),
});

const CreateBody = z.object({
  supplier: z.string().min(1),
  materialId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  unitCost: z.coerce.number().min(0),
  transportationCost: z.coerce.number().min(0).optional().default(0),
  otherCost: z.coerce.number().min(0).optional().default(0),
  purchaseDate: z.string().min(1),
  stockLocation: z.string().min(1),
});

const IdParam = z.object({ id: z.coerce.number().int().positive() });

async function generatePurchaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const agg = await prisma.materialPurchase.aggregate({ _max: { id: true } });
  const nextSeq = (agg._max.id ?? 0) + 1;
  const seq = String(nextSeq).padStart(4, "0");
  return `MPO-${year}-${seq}`;
}

function serializePurchase(p: {
  purchaseDate: Date;
  quantity: { toString(): string } | number;
  unitCost: { toString(): string } | number;
  transportationCost: { toString(): string } | number;
  otherCost: { toString(): string } | number;
  totalCost: { toString(): string } | number;
  currentQuantity: { toString(): string } | number;
  [key: string]: unknown;
}) {
  return {
    ...p,
    purchaseDate: p.purchaseDate instanceof Date ? p.purchaseDate.toISOString().slice(0, 10) : p.purchaseDate,
    quantity: toNum(p.quantity),
    unitCost: toNum(p.unitCost),
    transportationCost: toNum(p.transportationCost),
    otherCost: toNum(p.otherCost),
    totalCost: toNum(p.totalCost),
    currentQuantity: toNum(p.currentQuantity),
  };
}

// GET /material-purchases
router.get("/material-purchases", async (req, res): Promise<void> => {
  const parsed = ListQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, materialId, stockLocation, supplier } = parsed.data;

  const items = await prisma.materialPurchase.findMany({
    where: {
      ...(materialId ? { materialId } : {}),
      ...(stockLocation ? { stockLocation } : {}),
      ...(supplier ? { supplier: { contains: supplier, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { purchaseNumber: { contains: search, mode: "insensitive" } },
              { supplier: { contains: search, mode: "insensitive" } },
              { stockLocation: { contains: search, mode: "insensitive" } },
              { material: { name: { contains: search, mode: "insensitive" } } },
              { material: { materialCode: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { material: { select: materialSelect } },
    orderBy: { purchaseDate: "desc" },
  });

  res.json(items.map(serializePurchase));
});

// POST /material-purchases
router.post("/material-purchases", async (req, res): Promise<void> => {
  const parsed = CreateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    supplier,
    materialId,
    quantity,
    unit,
    unitCost,
    transportationCost,
    otherCost,
    purchaseDate,
    stockLocation,
  } = parsed.data;

  const material = await prisma.materialMaster.findUnique({ where: { id: materialId } });
  if (!material) {
    res.status(400).json({ error: "Material not found" });
    return;
  }

  const totalCost = quantity * unitCost + transportationCost + otherCost;
  const purchaseNumber = await generatePurchaseNumber();

  const created = await prisma.materialPurchase.create({
    data: {
      purchaseNumber,
      supplier,
      materialId,
      quantity,
      unit,
      unitCost,
      transportationCost,
      otherCost,
      totalCost,
      purchaseDate: new Date(purchaseDate),
      stockLocation,
      currentQuantity: quantity,
    },
    include: { material: { select: materialSelect } },
  });

  // Log PURCHASE movement
  await prisma.materialMovement.create({
    data: {
      materialId,
      stockLocation,
      purchaseNumber,
      movementType: "PURCHASE",
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
      movementDate: new Date(purchaseDate),
    },
  });

  // Sync inventory
  await syncMaterialInventory(materialId, stockLocation);

  res.status(201).json(serializePurchase(created));
});

// GET /material-purchases/:id
router.get("/material-purchases/:id", async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const item = await prisma.materialPurchase.findUnique({
    where: { id: params.data.id },
    include: { material: { select: materialSelect } },
  });

  if (!item) {
    res.status(404).json({ error: "Material purchase not found" });
    return;
  }

  res.json(serializePurchase(item));
});

export default router;
