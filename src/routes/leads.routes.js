import { Router } from "express";
import { createLead, deleteLead, getLead, listLeads, updateLead } from "../controllers/leads.controller.js";
const router = Router();
router.route("/").get(listLeads).post(createLead);
router.route("/:id").get(getLead).put(updateLead).delete(deleteLead);
export default router;
