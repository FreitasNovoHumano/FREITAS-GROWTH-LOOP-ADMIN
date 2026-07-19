import { Router } from "express";
import { requireAdminApiKey } from "../middlewares/require-admin-api-key.js";
import healthRoutes from "./health.routes.js";
import usersRoutes from "./users.routes.js";
import campaignsRoutes from "./campaigns.routes.js";
import leadsRoutes from "./leads.routes.js";
import publicCampaignsRoutes from "./public-campaigns.routes.js";

const router = Router();
router.use("/health", healthRoutes);
router.use("/growth-loop/campaigns", publicCampaignsRoutes);
router.use("/campaigns", publicCampaignsRoutes);
router.use("/users", requireAdminApiKey, usersRoutes);
router.use("/campaigns", requireAdminApiKey, campaignsRoutes);
router.use("/leads", requireAdminApiKey, leadsRoutes);
export default router;
