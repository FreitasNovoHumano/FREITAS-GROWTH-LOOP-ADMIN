import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";
import {
  claimReward,
  getPublicCampaign,
  registerLead,
} from "../controllers/public-campaigns.controller.js";

const router = Router();
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.growthLoopReadRateLimit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: "Limite de requisições excedido. Tente novamente em instantes." },
});
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.growthLoopWriteRateLimit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: "Limite de requisições excedido. Tente novamente em instantes." },
});

router.use(publicLimiter);
router.get("/:slug", getPublicCampaign);
router.post("/:slug/register", writeLimiter, registerLead);
router.get("/:slug/leads/:lead_slug/reward", claimReward);
router.get("/:slug/leads/:lead_slug/claim_reward", claimReward);

export default router;
