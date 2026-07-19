import { Router } from "express";
import prisma from "../config/database.js";
const router = Router();
router.get("/", async (_request, response, next) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    response.json({ status: "ok", database: "mongodb", timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});
export default router;
