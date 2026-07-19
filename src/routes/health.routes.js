import { Router } from "express";
import sequelize from "../config/database.js";
const router = Router();
router.get("/", async (_req, res, next) => { try { await sequelize.authenticate(); res.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() }); } catch (e) { next(e); } });
export default router;
