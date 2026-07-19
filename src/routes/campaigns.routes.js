import { Router } from "express";
import { createCampaign, deleteCampaign, getCampaign, listCampaigns, updateCampaign } from "../controllers/campaigns.controller.js";
const router = Router();
router.route("/").get(listCampaigns).post(createCampaign);
router.route("/:id").get(getCampaign).put(updateCampaign).delete(deleteCampaign);
export default router;
