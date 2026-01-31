import { Router } from "express";
import { getTeam, getCurrentUser } from "./team.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = Router();

router.get("/members", authMiddleware, getTeam);
router.get("/me", authMiddleware, getCurrentUser);

export default router;
