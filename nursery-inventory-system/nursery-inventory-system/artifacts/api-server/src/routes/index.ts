import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import healthRouter from "./health";
import plantsRouter from "./plants";
import plantBatchesRouter from "./plant-batches";
import productionBatchesRouter from "./production-batches";
import projectsRouter from "./projects";
import availableBatchesRouter from "./available-batches";
import plantIssuesRouter from "./plant-issues";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import usersRouter from "./users";
import auditLogsRouter from "./audit-logs";
import inventoryItemsRouter from "./inventory-items";
import materialMastersRouter from "./material-masters";
import materialPurchasesRouter from "./material-purchases";
import materialInventoryRouter from "./material-inventory";
import availableMaterialPurchasesRouter from "./available-material-purchases";

const router: IRouter = Router();

// Public routes (no auth required)
router.use(healthRouter);
router.use(authRouter); // /auth/login is public; /auth/logout & /auth/me handle auth internally

// All routes below require a valid JWT cookie
router.use(requireAuth);

router.use(usersRouter);
router.use(auditLogsRouter);
router.use(inventoryItemsRouter);
router.use(plantsRouter);
router.use(plantBatchesRouter);
router.use(productionBatchesRouter);
router.use(projectsRouter);
router.use(availableBatchesRouter);
router.use(plantIssuesRouter);
router.use(dashboardRouter);
router.use(materialMastersRouter);
router.use(materialPurchasesRouter);
router.use(materialInventoryRouter);
router.use(availableMaterialPurchasesRouter);

export default router;
