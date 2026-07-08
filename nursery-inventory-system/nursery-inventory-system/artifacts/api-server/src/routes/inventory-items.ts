import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

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

const ListQueryParams = z.object({
  search: z.string().optional(),
  plantId: z.coerce.number().int().optional(),
  nurseryLocation: z.string().optional(),
  sortBy: z.enum(["stock_asc", "stock_desc"]).optional(),
});

// ─── GET /inventory-items ─────────────────────────────────────────────────────
router.get("/inventory-items", async (req, res): Promise<void> => {
  const parsed = ListQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, plantId, nurseryLocation, sortBy } = parsed.data;

  const items = await prisma.inventoryItem.findMany({
    where: {
      ...(plantId ? { plantId } : {}),
      ...(nurseryLocation ? { nurseryLocation } : {}),
      ...(search
        ? {
            OR: [
              { plant: { commonName: { contains: search, mode: "insensitive" } } },
              { plant: { botanicalName: { contains: search, mode: "insensitive" } } },
              { plant: { plantCode: { contains: search, mode: "insensitive" } } },
              { nurseryLocation: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { plant: { select: plantSelect } },
    orderBy:
      sortBy === "stock_asc"
        ? { currentStock: "asc" }
        : sortBy === "stock_desc"
          ? { currentStock: "desc" }
          : { updatedAt: "desc" },
  });

  const [plantBatches, productionBatches] = await Promise.all([
    prisma.plantBatch.findMany({
      select: { plantId: true, potSize: true, nurseryLocation: true, currentQuantity: true, costPerPlant: true },
    }),
    prisma.productionBatch.findMany({
      select: { plantId: true, nurseryLocation: true, currentQuantity: true, costPerPlant: true, plant: { select: { potSize: true } } },
    }),
  ]);

  const costMap = new Map<string, { totalQtyCost: number; totalQty: number }>();
  const accumulate = (key: string, qty: number, cost: Parameters<typeof toNum>[0]) => {
    const e = costMap.get(key) ?? { totalQtyCost: 0, totalQty: 0 };
    e.totalQtyCost += qty * toNum(cost);
    e.totalQty += qty;
    costMap.set(key, e);
  };

  for (const b of plantBatches) accumulate(`${b.plantId}:${b.potSize}:${b.nurseryLocation}`, b.currentQuantity, b.costPerPlant);
  for (const b of productionBatches) accumulate(`${b.plantId}:${b.plant.potSize}:${b.nurseryLocation}`, b.currentQuantity, b.costPerPlant);

  const result = items.map((item) => {
    const costData = costMap.get(`${item.plantId}:${item.potSize}:${item.nurseryLocation}`);
    const costPerPlant = costData && costData.totalQty > 0 ? costData.totalQtyCost / costData.totalQty : 0;
    return {
      id: item.id,
      plantId: item.plantId,
      plant: item.plant,
      potSize: item.potSize,
      nurseryLocation: item.nurseryLocation,
      currentStock: item.currentStock,
      costPerPlant,
      inventoryValue: item.currentStock * costPerPlant,
      updatedAt: item.updatedAt,
    };
  });

  res.json(result);
});

// ─── GET /inventory-items/:id ─────────────────────────────────────────────────
router.get("/inventory-items/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { plant: { select: plantSelect } },
  });

  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }

  const [plantBatches, productionBatches] = await Promise.all([
    prisma.plantBatch.findMany({
      where: { plantId: item.plantId, potSize: item.potSize, nurseryLocation: item.nurseryLocation },
      orderBy: { purchaseDate: "desc" },
    }),
    prisma.productionBatch.findMany({
      where: { plantId: item.plantId, nurseryLocation: item.nurseryLocation },
      orderBy: { productionDate: "desc" },
    }),
  ]);

  // Weighted avg cost from current remaining stock
  let totalQtyCost = 0;
  let totalQty = 0;
  for (const b of plantBatches) {
    totalQtyCost += b.currentQuantity * toNum(b.costPerPlant);
    totalQty += b.currentQuantity;
  }
  for (const b of productionBatches) {
    totalQtyCost += b.currentQuantity * toNum(b.costPerPlant);
    totalQty += b.currentQuantity;
  }
  const costPerPlant = totalQty > 0 ? totalQtyCost / totalQty : 0;

  res.json({
    id: item.id,
    plantId: item.plantId,
    plant: item.plant,
    potSize: item.potSize,
    nurseryLocation: item.nurseryLocation,
    currentStock: item.currentStock,
    costPerPlant,
    inventoryValue: item.currentStock * costPerPlant,
    updatedAt: item.updatedAt,
    purchaseBatches: plantBatches.map((b) => ({
      batchNumber: b.batchNumber,
      supplier: b.supplier,
      purchaseDate: b.purchaseDate.toISOString().slice(0, 10),
      quantityPurchased: b.quantityPurchased,
      currentQuantity: b.currentQuantity,
      issuedQuantity: b.quantityPurchased - b.currentQuantity,
      costPerPlant: toNum(b.costPerPlant),
      totalBatchCost: toNum(b.totalBatchCost),
    })),
    productionBatches: productionBatches.map((b) => ({
      batchNumber: b.productionBatchNumber,
      productionType: b.productionType,
      productionDate: b.productionDate.toISOString().slice(0, 10),
      successfulPlants: b.successfulPlants,
      currentQuantity: b.currentQuantity,
      issuedQuantity: b.successfulPlants - b.currentQuantity,
      costPerPlant: toNum(b.costPerPlant),
      totalProductionCost: toNum(b.totalProductionCost),
    })),
  });
});

// ─── GET /inventory-items/:id/movements ───────────────────────────────────────
/** Validate that a string is a parseable ISO date (YYYY-MM-DD or ISO-8601). */
function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  return d;
}

const MovementsQueryParams = z.object({
  type: z.string().optional(),
  dateFrom: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(new Date(v).getTime()), {
      message: "dateFrom must be a valid ISO date (e.g. 2026-01-01)",
    }),
  dateTo: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(new Date(v).getTime()), {
      message: "dateTo must be a valid ISO date (e.g. 2026-12-31)",
    }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

router.get("/inventory-items/:id/movements", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }

  const parsed = MovementsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, dateFrom, dateTo, page, pageSize } = parsed.data;

  const parsedFrom = parseDate(dateFrom);
  const parsedTo = parseDate(dateTo);

  const where = {
    plantId: item.plantId,
    potSize: item.potSize,
    nurseryLocation: item.nurseryLocation,
    ...(type ? { movementType: type } : {}),
    ...((parsedFrom || parsedTo)
      ? {
          movementDate: {
            ...(parsedFrom ? { gte: parsedFrom } : {}),
            ...(parsedTo ? { lte: parsedTo } : {}),
          },
        }
      : {}),
  };

  const [total, movements] = await Promise.all([
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({
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
      batchNumber: m.batchNumber,
      batchSource: m.batchSource,
      quantity: m.quantity,
      costPerPlant: toNum(m.costPerPlant),
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

// ─── GET /inventory-items/:id/movements/export ────────────────────────────────
const ExportQueryParams = z.object({
  type: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

router.get("/inventory-items/:id/movements/export", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { plant: { select: { commonName: true, plantCode: true } } },
  });
  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }

  const parsed = ExportQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, dateFrom, dateTo } = parsed.data;

  const where = {
    plantId: item.plantId,
    potSize: item.potSize,
    nurseryLocation: item.nurseryLocation,
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

  const movements = await prisma.inventoryMovement.findMany({
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
  });

  const escapeCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const header = [
    "Date",
    "Movement Type",
    "Batch No.",
    "Batch Source",
    "Quantity",
    "Cost/Plant",
    "Total Cost",
    "Issue No.",
    "Project Code",
    "Project Name",
  ]
    .map(escapeCell)
    .join(",");

  const dataRows = movements.map((m) =>
    [
      m.movementDate.toISOString().slice(0, 10),
      m.movementType,
      m.batchNumber,
      m.batchSource,
      m.quantity,
      toNum(m.costPerPlant).toFixed(4),
      toNum(m.totalCost).toFixed(4),
      m.plantIssue?.issueNumber ?? "",
      m.plantIssue?.project.projectCode ?? "",
      m.plantIssue?.project.projectName ?? "",
    ]
      .map(escapeCell)
      .join(","),
  );

  const csv = [header, ...dataRows].join("\n");
  const filename = `inventory-${item.plant.plantCode}-${item.potSize}-movements.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
});

export default router;
