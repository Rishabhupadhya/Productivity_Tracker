import { Router } from "express";
import { addTask, getTasks, moveTask, removeTask } from "./task.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, addTask);
router.get("/", authMiddleware, getTasks);
router.patch("/:id", authMiddleware, moveTask);
router.delete("/:id", authMiddleware, removeTask);

export default router;
