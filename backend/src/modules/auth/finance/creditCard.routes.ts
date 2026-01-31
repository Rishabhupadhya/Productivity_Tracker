import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import * as creditCardController from "./creditCard.controller";

const router = Router();

// CRUD operations
router.post("/", authMiddleware, creditCardController.createCreditCard);
router.get("/", authMiddleware, creditCardController.getCreditCards);
router.get("/:cardId", authMiddleware, creditCardController.getCreditCardById);
router.patch("/:cardId", authMiddleware, creditCardController.updateCreditCard);
router.delete("/:cardId", authMiddleware, creditCardController.deleteCreditCard);

// Intelligence & analytics
router.get("/analytics/utilization", authMiddleware, creditCardController.getUtilizationOverview);
router.get("/:cardId/utilization", authMiddleware, creditCardController.getCardUtilization);
router.get("/analytics/alerts", authMiddleware, creditCardController.getCreditAlerts);
router.get("/:cardId/spike", authMiddleware, creditCardController.checkSpendingSpike);

export default router;
