import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import { syncInventory } from "../lib/inventory";
import { syncMaterialInventory } from "../lib/material-inventory";
import {
  ListPlantIssuesQueryParams,
  CreatePlantIssueBody,
  GetPlantIssueParams,
} from "@workspace/api-zod";

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

const materialSelect = {
  id: true,
  materialCode: true,
  name: true,
  category: true,
  unit: true,
} as const;

const issueInclude = {
  project: { select: { id: true, projectCode: true, projectName: true, clientName: true } },
  lines: { include: { plant: { select: plantSelect } } },
  materialLines: { include: { material: { select: materialSelect } } },
} as const;

function serializePlantIssue(issue: {
  issueDate: Date;
  totalValue: { toString(): string } | number;
  totalMaterialQuantity: { toString(): string } | number;
  totalMaterialValue: { toString(): string } | number;
  lines: {
    costPerPlant: { toString(): string } | number;
    totalCost: { toString(): string } | number;
  }[];
  materialLines: {
    issueQuantity: { toString(): string } | number;
    unitCost: { toString(): string } | number;
    totalCost: { toString(): string } | number;
  }[];
  [key: string]: unknown;
}) {
  return {
    ...issue,
    issueDate: issue.issueDate.toISOString().slice(0, 10),
    totalValue: toNum(issue.totalValue),
    totalMaterialQuantity: toNum(issue.totalMaterialQuantity),
    totalMaterialValue: toNum(issue.totalMaterialValue),
    lines: issue.lines.map((line) => ({
      ...line,
      costPerPlant: toNum(line.costPerPlant),
      totalCost: toNum(line.totalCost),
    })),
    materialLines: issue.materialLines.map((line) => ({
      ...line,
      issueQuantity: toNum(line.issueQuantity),
      unitCost: toNum(line.unitCost),
      totalCost: toNum(line.totalCost),
    })),
  };
}

/** Generate an issue number and retry up to 5 times on unique collision. */
async function generateIssueNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const agg = await prisma.plantIssue.aggregate({ _max: { id: true } });
  const nextSeq = (agg._max.id ?? 0) + 1;
  const seq = String(nextSeq).padStart(4, "0");
  return `PIV-${year}-${seq}`;
}

function isUnique(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}

// GET /plant-issues
router.get("/plant-issues", async (req, res): Promise<void> => {
  const parsed = ListPlantIssuesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, projectId } = parsed.data;

  const issues = await prisma.plantIssue.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(search
        ? {
            OR: [
              { issueNumber: { contains: search, mode: "insensitive" } },
              { requestedBy: { contains: search, mode: "insensitive" } },
              { issuedBy: { contains: search, mode: "insensitive" } },
              { project: { projectName: { contains: search, mode: "insensitive" } } },
              { project: { clientName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: issueInclude,
    orderBy: { issueDate: "desc" },
  });

  res.json(issues.map(serializePlantIssue));
});

// POST /plant-issues
router.post("/plant-issues", async (req, res): Promise<void> => {
  const parsed = CreatePlantIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    issueNumber: rawIssueNumber,
    issueDate,
    projectId,
    requestedBy,
    issuedBy,
    remarks,
    lines,
    materialLines,
  } = parsed.data;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    res.status(400).json({ error: "Project not found" });
    return;
  }

  // ── Validate plant lines ──────────────────────────────────────────────────
  const batchChecks: {
    line: (typeof lines)[number];
    plant: { id: number; potSize: string; commonName: string };
    availableQuantity: number;
    costPerPlant: number;
    nurseryLocation: string;
  }[] = [];

  for (const line of lines) {
    const plant = await prisma.plantMaster.findUnique({ where: { id: line.plantId } });
    if (!plant) {
      res.status(400).json({ error: `Plant ${line.plantId} not found` });
      return;
    }

    if (line.batchSource === "PURCHASE") {
      const batch = await prisma.plantBatch.findUnique({
        where: { batchNumber: line.batchNumber },
      });
      if (!batch || batch.plantId !== line.plantId || batch.potSize !== line.potSize) {
        res.status(400).json({ error: `Batch ${line.batchNumber} not found for this plant/pot size` });
        return;
      }
      if (batch.currentQuantity < line.issueQuantity) {
        res.status(400).json({
          error: `Insufficient stock in batch ${line.batchNumber}: available ${batch.currentQuantity}, requested ${line.issueQuantity}`,
        });
        return;
      }
      batchChecks.push({
        line,
        plant,
        availableQuantity: batch.currentQuantity,
        costPerPlant: toNum(batch.costPerPlant),
        nurseryLocation: batch.nurseryLocation,
      });
    } else {
      const batch = await prisma.productionBatch.findUnique({
        where: { productionBatchNumber: line.batchNumber },
      });
      if (!batch || batch.plantId !== line.plantId) {
        res.status(400).json({ error: `Batch ${line.batchNumber} not found for this plant` });
        return;
      }
      if (batch.currentQuantity < line.issueQuantity) {
        res.status(400).json({
          error: `Insufficient stock in batch ${line.batchNumber}: available ${batch.currentQuantity}, requested ${line.issueQuantity}`,
        });
        return;
      }
      batchChecks.push({
        line,
        plant,
        availableQuantity: batch.currentQuantity,
        costPerPlant: toNum(batch.costPerPlant),
        nurseryLocation: batch.nurseryLocation,
      });
    }
  }

  // ── Validate material lines ───────────────────────────────────────────────
  const matChecks: {
    line: NonNullable<typeof materialLines>[number];
    unitCost: number;
    /** Canonical stockLocation from the DB record — never trust client-supplied value */
    stockLocation: string;
  }[] = [];

  for (const mLine of materialLines ?? []) {
    const material = await prisma.materialMaster.findUnique({ where: { id: mLine.materialId } });
    if (!material) {
      res.status(400).json({ error: `Material ${mLine.materialId} not found` });
      return;
    }

    const purchase = await prisma.materialPurchase.findUnique({
      where: { purchaseNumber: mLine.purchaseNumber },
    });
    if (!purchase || purchase.materialId !== mLine.materialId) {
      res.status(400).json({ error: `Purchase ${mLine.purchaseNumber} not found for this material` });
      return;
    }
    // Enforce exact stock-location match to prevent ledger/inventory desync
    if (purchase.stockLocation !== mLine.stockLocation) {
      res.status(400).json({
        error: `Stock location mismatch for purchase ${mLine.purchaseNumber}: expected "${purchase.stockLocation}", got "${mLine.stockLocation}"`,
      });
      return;
    }
    const available = toNum(purchase.currentQuantity);
    if (available < mLine.issueQuantity) {
      res.status(400).json({
        error: `Insufficient stock in purchase ${mLine.purchaseNumber}: available ${available}, requested ${mLine.issueQuantity}`,
      });
      return;
    }
    matChecks.push({ line: mLine, unitCost: toNum(purchase.unitCost), stockLocation: purchase.stockLocation });
  }

  // ── Compute totals ────────────────────────────────────────────────────────
  const providedIssueNumber = rawIssueNumber?.trim();
  const totalQuantity = lines.reduce((sum, l) => sum + l.issueQuantity, 0);
  const totalValue = batchChecks.reduce(
    (sum, c) => sum + c.costPerPlant * c.line.issueQuantity,
    0,
  );
  const totalMaterialQuantity = matChecks.reduce((sum, c) => sum + c.line.issueQuantity, 0);
  const totalMaterialValue = matChecks.reduce(
    (sum, c) => sum + c.unitCost * c.line.issueQuantity,
    0,
  );

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Decrement plant batches
      for (const check of batchChecks) {
        if (check.line.batchSource === "PURCHASE") {
          const updated = await tx.plantBatch.updateMany({
            where: { batchNumber: check.line.batchNumber, currentQuantity: { gte: check.line.issueQuantity } },
            data: { currentQuantity: { decrement: check.line.issueQuantity } },
          });
          if (updated.count === 0) {
            throw new Error(`Insufficient stock in batch ${check.line.batchNumber}`);
          }
        } else {
          const updated = await tx.productionBatch.updateMany({
            where: {
              productionBatchNumber: check.line.batchNumber,
              currentQuantity: { gte: check.line.issueQuantity },
            },
            data: { currentQuantity: { decrement: check.line.issueQuantity } },
          });
          if (updated.count === 0) {
            throw new Error(`Insufficient stock in batch ${check.line.batchNumber}`);
          }
        }
      }

      // Decrement material purchases — atomic guard prevents over-issue under concurrency
      for (const check of matChecks) {
        const updated = await tx.materialPurchase.updateMany({
          where: {
            purchaseNumber: check.line.purchaseNumber,
            materialId: check.line.materialId,
            stockLocation: check.stockLocation,
            currentQuantity: { gte: check.line.issueQuantity },
          },
          data: { currentQuantity: { decrement: check.line.issueQuantity } },
        });
        if (updated.count === 0) {
          throw new Error(`Insufficient stock in purchase ${check.line.purchaseNumber} (concurrent update)`);
        }
      }

      let issueNumber = providedIssueNumber;
      if (!issueNumber) {
        issueNumber = await generateIssueNumber();
      }

      const issue = await tx.plantIssue.create({
        data: {
          issueNumber,
          issueDate: new Date(issueDate),
          projectId,
          requestedBy,
          issuedBy,
          remarks,
          totalQuantity,
          totalValue,
          totalMaterialQuantity,
          totalMaterialValue,
          lines: {
            create: batchChecks.map((c) => ({
              plantId: c.line.plantId,
              batchNumber: c.line.batchNumber,
              batchSource: c.line.batchSource,
              potSize: c.line.potSize,
              issueQuantity: c.line.issueQuantity,
              costPerPlant: c.costPerPlant,
              totalCost: c.costPerPlant * c.line.issueQuantity,
            })),
          },
          materialLines: {
            create: matChecks.map((c) => ({
              materialId: c.line.materialId,
              purchaseNumber: c.line.purchaseNumber,
              stockLocation: c.line.stockLocation,
              unit: c.line.unit,
              issueQuantity: c.line.issueQuantity,
              unitCost: c.unitCost,
              totalCost: c.unitCost * c.line.issueQuantity,
            })),
          },
        },
        include: issueInclude,
      });

      // Plant inventory movements
      await tx.inventoryMovement.createMany({
        data: batchChecks.map((c) => ({
          plantId: c.line.plantId,
          potSize: c.line.potSize,
          nurseryLocation: c.nurseryLocation,
          batchNumber: c.line.batchNumber,
          batchSource: c.line.batchSource,
          movementType: "ISSUE",
          quantity: -c.line.issueQuantity,
          costPerPlant: c.costPerPlant,
          totalCost: c.costPerPlant * c.line.issueQuantity,
          plantIssueId: issue.id,
          movementDate: new Date(issueDate),
        })),
      });

      // Material inventory movements — use canonical stockLocation from DB, not client payload
      if (matChecks.length > 0) {
        await tx.materialMovement.createMany({
          data: matChecks.map((c) => ({
            materialId: c.line.materialId,
            stockLocation: c.stockLocation,
            purchaseNumber: c.line.purchaseNumber,
            movementType: "ISSUE",
            quantity: -c.line.issueQuantity,
            unitCost: c.unitCost,
            totalCost: c.unitCost * c.line.issueQuantity,
            plantIssueId: issue.id,
            movementDate: new Date(issueDate),
          })),
        });
      }

      return issue;
    });

    // Sync plant inventory
    const uniquePlantTargets = new Map<string, { plantId: number; potSize: string; nurseryLocation: string }>();
    for (const c of batchChecks) {
      const key = `${c.line.plantId}|${c.line.potSize}|${c.nurseryLocation}`;
      uniquePlantTargets.set(key, {
        plantId: c.line.plantId,
        potSize: c.line.potSize,
        nurseryLocation: c.nurseryLocation,
      });
    }
    for (const t of uniquePlantTargets.values()) {
      await syncInventory(t.plantId, t.potSize, t.nurseryLocation);
    }

    // Sync material inventory — use canonical stockLocation from DB
    const uniqueMatTargets = new Map<string, { materialId: number; stockLocation: string }>();
    for (const c of matChecks) {
      const key = `${c.line.materialId}|${c.stockLocation}`;
      uniqueMatTargets.set(key, { materialId: c.line.materialId, stockLocation: c.stockLocation });
    }
    for (const t of uniqueMatTargets.values()) {
      await syncMaterialInventory(t.materialId, t.stockLocation);
    }

    res.status(201).json(serializePlantIssue(created));
  } catch (err) {
    if (isUnique(err)) {
      res.status(409).json({ error: "Issue number already exists" });
      return;
    }
    if (err instanceof Error && err.message.startsWith("Insufficient stock")) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

// GET /plant-issues/:id
router.get("/plant-issues/:id", async (req, res): Promise<void> => {
  const params = GetPlantIssueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const issue = await prisma.plantIssue.findUnique({
    where: { id: params.data.id },
    include: issueInclude,
  });

  if (!issue) {
    res.status(404).json({ error: "Plant issue not found" });
    return;
  }

  res.json(serializePlantIssue(issue));
});

export default router;
