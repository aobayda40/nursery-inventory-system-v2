import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";

const router: IRouter = Router();

function toNum(v: { toString(): string } | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v.toString());
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /dashboard/summary
router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const today = startOfToday();
  const monthStart = startOfMonth();

  const [todayAgg, monthAgg, monthLines] = await Promise.all([
    prisma.plantIssue.aggregate({
      where: { issueDate: { gte: today } },
      _sum: { totalQuantity: true },
    }),
    prisma.plantIssue.aggregate({
      where: { issueDate: { gte: monthStart } },
      _sum: { totalQuantity: true, totalValue: true },
    }),
    prisma.plantIssueLine.findMany({
      where: { plantIssue: { issueDate: { gte: monthStart } } },
      select: {
        issueQuantity: true,
        totalCost: true,
        plantIssue: {
          select: {
            project: { select: { id: true, projectCode: true, projectName: true } },
          },
        },
      },
    }),
  ]);

  const projectTotals = new Map<
    number,
    { projectId: number; projectCode: string; projectName: string; totalQuantity: number; totalValue: number }
  >();

  for (const line of monthLines) {
    const project = line.plantIssue.project;
    const existing = projectTotals.get(project.id);
    if (existing) {
      existing.totalQuantity += line.issueQuantity;
      existing.totalValue += toNum(line.totalCost);
    } else {
      projectTotals.set(project.id, {
        projectId: project.id,
        projectCode: project.projectCode,
        projectName: project.projectName,
        totalQuantity: line.issueQuantity,
        totalValue: toNum(line.totalCost),
      });
    }
  }

  const topProjects = Array.from(projectTotals.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);

  res.json({
    plantsIssuedToday: todayAgg._sum.totalQuantity ?? 0,
    plantsIssuedThisMonth: monthAgg._sum.totalQuantity ?? 0,
    inventoryValueIssuedThisMonth: toNum(monthAgg._sum.totalValue),
    topProjects,
  });
});

export default router;
