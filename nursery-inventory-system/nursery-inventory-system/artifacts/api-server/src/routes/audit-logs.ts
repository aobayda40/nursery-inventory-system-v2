import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

const ListAuditLogsQuery = z.object({
  userId: z.coerce.number().optional(),
  entity: z.string().optional(),
  action: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// GET /audit-logs
router.get(
  "/audit-logs",
  requireAuth,
  requireRole("Administrator", "Manager"),
  async (req, res): Promise<void> => {
    const parsed = ListAuditLogsQuery.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { userId, entity, action, limit, offset } = parsed.data;

    const where: Record<string, unknown> = {};
    if (userId !== undefined) where["userId"] = userId;
    if (entity) where["entity"] = entity;
    if (action) where["action"] = { contains: action, mode: "insensitive" };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, limit, offset });
  },
);

export default router;
