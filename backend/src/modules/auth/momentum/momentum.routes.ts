import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import * as momentumController from "./momentum.controller";

const router = Router();

router.get("/stats", authMiddleware, momentumController.getStats);

export default router;
