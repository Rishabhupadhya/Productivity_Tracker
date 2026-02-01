import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import * as habitController from "./habit.controller";

const router = Router();

router.post("/", authMiddleware, habitController.createHabit);
router.get("/", authMiddleware, habitController.getHabits);
router.get("/today", authMiddleware, habitController.getTodaysHabits);
router.patch("/:habitId", authMiddleware, habitController.updateHabit);
router.delete("/:habitId", authMiddleware, habitController.deleteHabit);

// Completion
router.post("/:habitId/complete", authMiddleware, habitController.completeHabit);
router.post("/:habitId/uncomplete", authMiddleware, habitController.uncompleteHabit);

// Stats and Calendar
router.get("/:habitId/stats", authMiddleware, habitController.getStats);
router.get("/:habitId/calendar", authMiddleware, habitController.getCalendar);

export default router;
