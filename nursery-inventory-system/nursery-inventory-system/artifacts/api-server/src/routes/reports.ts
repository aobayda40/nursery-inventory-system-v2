import { Router, type IRouter } from "express";
import { REPORT_DEFINITIONS, findReportDefinition } from "../lib/reports/registry";

const router: IRouter = Router();

// GET /reports/categories — the report catalog (id, name, description, group).
// Open to any authenticated user: Administrator/Manager have full access to
// every report, and other roles get read-only access to the same catalog —
// there is nothing to write yet, so no role restriction is needed here.
router.get("/reports/categories", (_req, res): void => {
  res.json(REPORT_DEFINITIONS);
});

// GET /reports/:reportId/generate — placeholder for Phase 2 report generation.
// Validates the reportId against the catalog and responds 501 so the
// frontend can distinguish "not built yet" from a real error or a bad id.
router.get("/reports/:reportId/generate", (req, res): void => {
  const reportId = req.params["reportId"] as string;
  const report = findReportDefinition(reportId);

  if (!report) {
    res.status(404).json({ error: `Unknown report id: ${reportId}` });
    return;
  }

  res.status(501).json({
    error: `The "${report.name}" report is not implemented yet. This endpoint is a placeholder for Phase 2.`,
  });
});

export default router;
