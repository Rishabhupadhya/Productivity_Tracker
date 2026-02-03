import { Router } from "express";
import { addTask, getTasks, moveTask, removeTask, completeTask } from "./task.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, addTask);
router.get("/", authMiddleware, getTasks);
router.patch("/:id", authMiddleware, moveTask);
router.patch("/:id/complete", authMiddleware, completeTask); // Task completion
router.delete("/:id", authMiddleware, removeTask);

export default router;

