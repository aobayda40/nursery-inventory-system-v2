import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middlewares/auth";
import { createAuditLog } from "../lib/audit";
import { z } from "zod";

const router: IRouter = Router();

const RoleEnum = z.enum([
  "Administrator",
  "Manager",
  "Accountant",
  "InventoryController",
  "NurseryStaff",
]);

const CreateUserBody = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: RoleEnum,
  password: z.string().min(8),
});

const UpdateUserBody = z.object({
  name: z.string().min(1).optional(),
  role: RoleEnum.optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
});

// GET /users
router.get(
  "/users",
  requireAuth,
  requireRole("Administrator", "Manager"),
  async (req, res): Promise<void> => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(users);
  },
);

// POST /users
router.post(
  "/users",
  requireAuth,
  requireRole("Administrator"),
  async (req, res): Promise<void> => {
    const parsed = CreateUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { email, name, role, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const user = await prisma.user.create({
        data: { email, name, role, passwordHash },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await createAuditLog({
        req,
        userId: req.user!.sub,
        action: "CREATE",
        entity: "User",
        entityId: user.id,
        details: `Created user ${email} with role ${role}`,
      });

      res.status(201).json(user);
    } catch (err: unknown) {
      if (isUniqueConstraintError(err)) {
        res.status(409).json({ error: "Email already exists" });
        return;
      }
      throw err;
    }
  },
);

// GET /users/:id
router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  // Non-admins can only view their own profile
  if (
    req.user!.role !== "Administrator" &&
    req.user!.role !== "Manager" &&
    req.user!.sub !== id
  ) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

// PUT /users/:id
router.put("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  // Non-admins can only edit their own profile (and cannot change role/isActive)
  const isSelf = req.user!.sub === id;
  const isAdmin = req.user!.role === "Administrator";

  if (!isAdmin && !isSelf) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, role, password, isActive } = parsed.data;

  // Non-admins cannot change role or active status
  if (!isAdmin && (role !== undefined || isActive !== undefined)) {
    res.status(403).json({ error: "Cannot modify role or status" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData["name"] = name;
  if (role !== undefined) updateData["role"] = role;
  if (isActive !== undefined) updateData["isActive"] = isActive;
  if (password !== undefined) updateData["passwordHash"] = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      details: `Updated user ${user.email}`,
    });

    res.json(user);
  } catch (err: unknown) {
    if (isNotFoundError(err)) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    throw err;
  }
});

// DELETE /users/:id
router.delete(
  "/users/:id",
  requireAuth,
  requireRole("Administrator"),
  async (req, res): Promise<void> => {
    const id = Number(req.params["id"]);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    // Cannot delete yourself
    if (req.user!.sub === id) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }

    try {
      const user = await prisma.user.delete({ where: { id } });

      await createAuditLog({
        req,
        userId: req.user!.sub,
        action: "DELETE",
        entity: "User",
        entityId: id,
        details: `Deleted user ${user.email}`,
      });

      res.sendStatus(204);
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      throw err;
    }
  },
);

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}

function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2025"
  );
}

export default router;
