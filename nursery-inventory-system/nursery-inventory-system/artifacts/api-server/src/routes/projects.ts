import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import {
  ListProjectsQueryParams,
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
  GetProjectHistoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toNum(v: { toString(): string } | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v.toString());
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

function isForeignKeyConstraint(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2003"
  );
}

/** Generate a project code and retry up to 5 times on unique collision. */
async function generateProjectCode(): Promise<string> {
  const year = new Date().getFullYear();
  const agg = await prisma.project.aggregate({ _max: { id: true } });
  const nextSeq = (agg._max.id ?? 0) + 1;
  const seq = String(nextSeq).padStart(4, "0");
  return `PRJ-${year}-${seq}`;
}

async function createProjectWithRetry(
  data: Parameters<typeof prisma.project.create>[0]["data"],
  attempts = 5,
) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await prisma.project.create({ data });
    } catch (err) {
      if (isUnique(err) && i < attempts - 1 && !data.projectCode) {
        data = { ...data, projectCode: await generateProjectCode() };
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to generate unique project code after retries");
}

function serializePlantIssueLine(line: {
  id: number;
  plantId: number;
  plant: {
    id: number;
    plantCode: string;
    commonName: string;
    botanicalName: string;
    potSize: string;
    imageUrl: string | null;
  };
  batchNumber: string;
  batchSource: string;
  potSize: string;
  issueQuantity: number;
  costPerPlant: { toString(): string } | number;
  totalCost: { toString(): string } | number;
}) {
  return {
    ...line,
    costPerPlant: toNum(line.costPerPlant),
    totalCost: toNum(line.totalCost),
  };
}

function serializePlantIssue(issue: {
  id: number;
  issueNumber: string;
  issueDate: Date;
  projectId: number;
  project: { id: number; projectCode: string; projectName: string; clientName: string };
  requestedBy: string;
  issuedBy: string;
  remarks: string | null;
  totalQuantity: number;
  totalValue: { toString(): string } | number;
  lines: Parameters<typeof serializePlantIssueLine>[0][];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...issue,
    issueDate: issue.issueDate.toISOString().slice(0, 10),
    totalValue: toNum(issue.totalValue),
    lines: issue.lines.map(serializePlantIssueLine),
  };
}

const plantSelect = {
  id: true,
  plantCode: true,
  commonName: true,
  botanicalName: true,
  potSize: true,
  imageUrl: true,
} as const;

// ── routes ───────────────────────────────────────────────────────────────────

// GET /projects
router.get("/projects", async (req, res): Promise<void> => {
  const parsed = ListProjectsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, status } = parsed.data;

  const projects = await prisma.project.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { projectCode: { contains: search, mode: "insensitive" } },
              { projectName: { contains: search, mode: "insensitive" } },
              { clientName: { contains: search, mode: "insensitive" } },
              { projectLocation: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(projects);
});

// POST /projects
router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { projectCode: rawProjectCode, projectName, clientName, projectLocation, status, notes } =
    parsed.data;

  const providedProjectCode = rawProjectCode?.trim();
  const projectCode = providedProjectCode || (await generateProjectCode());

  const data = {
    projectCode,
    projectName,
    clientName,
    projectLocation,
    status: status ?? "Active",
    notes,
  };

  try {
    const project = providedProjectCode
      ? await prisma.project.create({ data })
      : await createProjectWithRetry(data);

    res.status(201).json(project);
  } catch (err) {
    if (isUnique(err)) {
      res.status(409).json({ error: "Project code already exists" });
      return;
    }
    throw err;
  }
});

// GET /projects/:id
router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const project = await prisma.project.findUnique({ where: { id: params.data.id } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(project);
});

// PUT /projects/:id
router.put("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { projectCode, projectName, clientName, projectLocation, status, notes } = parsed.data;

  try {
    const project = await prisma.project.update({
      where: { id: params.data.id },
      data: {
        ...(projectCode !== undefined ? { projectCode } : {}),
        ...(projectName !== undefined ? { projectName } : {}),
        ...(clientName !== undefined ? { clientName } : {}),
        ...(projectLocation !== undefined ? { projectLocation } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    res.json(project);
  } catch (err) {
    if (isNotFound(err)) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (isUnique(err)) {
      res.status(409).json({ error: "Project code already exists" });
      return;
    }
    throw err;
  }
});

// DELETE /projects/:id
router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    await prisma.project.delete({ where: { id: params.data.id } });
    res.sendStatus(204);
  } catch (err) {
    if (isNotFound(err)) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (isForeignKeyConstraint(err)) {
      res
        .status(409)
        .json({ error: "Project has issue history and cannot be deleted" });
      return;
    }
    throw err;
  }
});

// GET /projects/:id/history
router.get("/projects/:id/history", async (req, res): Promise<void> => {
  const params = GetProjectHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const project = await prisma.project.findUnique({ where: { id: params.data.id } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const issues = await prisma.plantIssue.findMany({
    where: { projectId: params.data.id },
    include: {
      project: { select: { id: true, projectCode: true, projectName: true, clientName: true } },
      lines: { include: { plant: { select: plantSelect } } },
    },
    orderBy: { issueDate: "desc" },
  });

  res.json({
    project,
    issues: issues.map(serializePlantIssue),
  });
});

export default router;
