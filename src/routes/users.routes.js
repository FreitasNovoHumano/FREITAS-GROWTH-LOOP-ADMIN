import { Router } from "express";
import { deleteUser, getUser, listUsers, updateUser } from "../controllers/users.controller.js";
const router = Router();
router.get("/", listUsers);
router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);
export default router;
