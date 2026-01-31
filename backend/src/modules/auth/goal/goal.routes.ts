import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import * as goalController from "./goal.controller";

const router = Router();

router.post("/", authMiddleware, goalController.createGoal);
router.get("/", authMiddleware, goalController.getGoals);
router.patch("/:goalId", authMiddleware, goalController.updateGoal);
router.post("/:goalId/progress", authMiddleware, goalController.updateProgress);
router.delete("/:goalId", authMiddleware, goalController.deleteGoal);

// Reviews
router.post("/:goalId/reviews", authMiddleware, goalController.addReview);
router.get("/:goalId/reviews", authMiddleware, goalController.getReviews);

// Progress info
router.get("/:goalId/progress", authMiddleware, goalController.getProgress);

export default router;
