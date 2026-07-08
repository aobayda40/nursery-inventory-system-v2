import { prisma } from "./prisma";
import type { Request } from "express";

export async function createAuditLog(opts: {
  req?: Request;
  userId?: number | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  details?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId != null ? String(opts.entityId) : null,
        details: opts.details ?? null,
        ipAddress: opts.req
          ? (opts.req.headers["x-forwarded-for"] as string | undefined) ??
            opts.req.socket.remoteAddress ??
            null
          : null,
      },
    });
  } catch {
    // Audit log failures must never break the main request
  }
}
