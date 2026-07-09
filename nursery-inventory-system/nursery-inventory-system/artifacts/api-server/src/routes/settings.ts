import { Router, type IRouter } from "express";
import { prisma } from "../lib/prisma";
import { requireRole } from "../middlewares/auth";
import { createAuditLog } from "../lib/audit";
import { UpdateSettingsBody, ImportSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Keys that may be stored/read through the Settings module.
// Namespaced so new sections can be added without a migration.
const ALLOWED_KEYS = new Set([
  // Company Profile
  "company.name",
  "company.logo",
  "company.address",
  "company.phone",
  "company.email",
  "company.website",
  "company.taxNumber",
  "company.defaultLocation",
  // System Preferences
  "system.currency",
  "system.dateFormat",
  "system.timeFormat",
  "system.numberFormat",
  "system.units",
  "system.language",
  // Inventory Settings
  "inventory.lowStockAlertsEnabled",
  "inventory.lowStockThreshold",
  "inventory.stockCalculationMethod",
  "inventory.allowNegativeInventory",
  "inventory.defaultLocation",
  // Appearance / Branding
  "appearance.theme",
  "appearance.primaryColor",
  // Backup & Data Management
  "backup.lastBackupDate",
]);

async function readAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

// GET /settings — any authenticated user (theme/currency/units are read app-wide)
router.get("/settings", async (_req, res): Promise<void> => {
  res.json(await readAllSettings());
});

// PUT /settings — bulk upsert, Administrator/Manager only
router.put(
  "/settings",
  requireRole("Administrator", "Manager"),
  async (req, res): Promise<void> => {
    const parsed = UpdateSettingsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const entries = Object.entries(parsed.data);
    const unknownKeys = entries
      .map(([key]) => key)
      .filter((key) => !ALLOWED_KEYS.has(key));
    if (unknownKeys.length > 0) {
      res.status(400).json({ error: `Unknown setting key(s): ${unknownKeys.join(", ")}` });
      return;
    }

    // Guard against oversized base64 logo uploads (~2 MB limit for base64 = ~1.5 MB decoded).
    const logoEntry = parsed.data["company.logo"];
    if (logoEntry && logoEntry.length > 2_800_000) {
      res.status(400).json({ error: "company.logo exceeds the 2 MB limit. Please resize the image before uploading." });
      return;
    }

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: "UPDATE",
      entity: "Setting",
      details: `Updated settings: ${entries.map(([key]) => key).join(", ")}`,
    });

    res.json(await readAllSettings());
  },
);

// GET /settings/export — full backup snapshot, Administrator/Manager only
router.get(
  "/settings/export",
  requireRole("Administrator", "Manager"),
  async (req, res): Promise<void> => {
    const settings = await readAllSettings();

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: "EXPORT",
      entity: "Setting",
      details: "Exported settings backup",
    });

    res.json({ exportedAt: new Date().toISOString(), settings });
  },
);

// POST /settings/import — restore from a backup snapshot, Administrator/Manager only
router.post(
  "/settings/import",
  requireRole("Administrator", "Manager"),
  async (req, res): Promise<void> => {
    const parsed = ImportSettingsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const entries = Object.entries(parsed.data).filter(([key]) =>
      ALLOWED_KEYS.has(key),
    );

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: "IMPORT",
      entity: "Setting",
      details: `Imported ${entries.length} setting(s) from backup`,
    });

    res.json(await readAllSettings());
  },
);

export default router;
